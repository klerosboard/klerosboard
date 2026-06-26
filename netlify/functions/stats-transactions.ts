import { Handler } from "@netlify/functions";
import { ChainId, TimestampCounter } from "./_shared/types";
import { querySubgraph, getSubgraphEndpoint } from "./_shared/subgraph-client";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, max-age=3600",
};

/**
 * Convert unix timestamp (seconds) to month key (first of month in ms).
 */
function timestampToMonthKey(unixSeconds: number): number {
  const d = new Date(unixSeconds * 1000);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
}

/**
 * Fetch transaction count for v1 chains (Ethereum, Gnosis).
 * Counts 5 event types: stakeSets, disputes, votes, tokenAndETHShifts, draws.
 * All queries run in parallel, paginated until < 1000 results.
 */
async function fetchTransactionsV1(chainId: "1" | "100"): Promise<TimestampCounter> {
  const subgraphEndpoint = getSubgraphEndpoint(chainId);
  const monthCounts: Map<number, number> = new Map();

  // Helper to paginate a single entity
  async function paginateEntity(
    entityName: string,
    timestampField: string,
    whereFilter: string,
    orderBy: string = "id"
  ): Promise<Array<{ timestamp: number }>> {
    const allResults: Array<{ timestamp: number }> = [];
    let lastCursor: number | string = 0;

    while (true) {
      const whereClause: string = whereFilter
        ? `where: { ${whereFilter.replace("$lastCursor", `"${lastCursor}"`)} }`
        : "";

      const query: string = `
        query {
          ${entityName}(
            ${whereClause}
            orderBy: ${orderBy}
            orderDirection: asc
            first: 1000
          ) {
            id
            ${timestampField}
          }
        }
      `;

      const response: Record<string, Array<{ id: string; [key: string]: number | string }>> = await querySubgraph<{
        [key: string]: Array<{ id: string; [key: string]: number | string }>;
      }>(subgraphEndpoint, query);

      const items: Array<{ id: string; [key: string]: number | string }> | undefined = response[entityName];
      if (!items || items.length === 0) break;

      // Transform and collect
      items.forEach((item: { id: string; [key: string]: number | string }) => {
        allResults.push({
          timestamp: Number(item[timestampField]),
        });
      });

      if (items.length < 1000) break;

      // Update cursor for next batch
      lastCursor = items[items.length - 1].id;
    }

    return allResults;
  }

  // Execute all 5 entity queries in parallel
  const [stakes, disputes, votes, transfers, draws] = await Promise.allSettled([
    paginateEntity(
      "stakeSets",
      "timestamp",
      "id_gt: $lastCursor",
      "id"
    ),
    paginateEntity(
      "disputes",
      "startTime",
      "startTime_gt: $lastCursor",
      "startTime"
    ),
    paginateEntity(
      "votes",
      "timestamp",
      "timestamp_gt: $lastCursor",
      "timestamp"
    ),
    paginateEntity(
      "tokenAndETHShifts",
      "timestamp",
      "ETHAmount_gt: \"0\", timestamp_gt: $lastCursor",
      "timestamp"
    ),
    paginateEntity(
      "draws",
      "timestamp",
      "timestamp_gt: $lastCursor",
      "timestamp"
    ),
  ]);

  // Aggregate all successful results
  const allEvents: Array<{ timestamp: number }> = [];

  if (stakes.status === "fulfilled") {
    allEvents.push(...stakes.value);
  }
  if (disputes.status === "fulfilled") {
    allEvents.push(...disputes.value);
  }
  if (votes.status === "fulfilled") {
    allEvents.push(...votes.value);
  }
  if (transfers.status === "fulfilled") {
    allEvents.push(...transfers.value);
  }
  if (draws.status === "fulfilled") {
    allEvents.push(...draws.value);
  }

  // Group by month
  allEvents.forEach((event) => {
    const monthKey = timestampToMonthKey(event.timestamp);
    monthCounts.set(monthKey, (monthCounts.get(monthKey) ?? 0) + 1);
  });

  // Convert map to TimestampCounter
  const result: TimestampCounter = {};
  for (const [monthKey, count] of monthCounts.entries()) {
    result[String(monthKey)] = count;
  }

  return result;
}

/**
 * Fetch transaction count for v2 (Arbitrum).
 * Only disputes are counted (disputes.createdAt field).
 * Other entities lack timestamp equivalents in v2 schema.
 * This is a known gap documented in code.
 */
async function fetchTransactionsV2(): Promise<TimestampCounter> {
  const subgraphEndpoint = getSubgraphEndpoint("42161");
  const monthCounts: Map<number, number> = new Map();

  // v2: Only disputes with createdAt
  const allDisputes: Array<{ createdAt: number }> = [];
  let lastCursor: string = "";

  while (true) {
    const query = `
      query {
        disputes(
          ${lastCursor ? `where: { createdAt_gt: ${lastCursor} }` : ""}
          orderBy: createdAt
          orderDirection: asc
          first: 1000
        ) {
          id
          createdAt
        }
      }
    `;

    const response = await querySubgraph<{
      disputes: Array<{ id: string; createdAt: number }>;
    }>(subgraphEndpoint, query);

    const items = response.disputes;
    if (!items || items.length === 0) break;

    allDisputes.push(...items);

    if (items.length < 1000) break;

    // Set cursor to last createdAt for next batch
    lastCursor = String(items[items.length - 1].createdAt);
  }

  // Group by month
  allDisputes.forEach((dispute) => {
    const monthKey = timestampToMonthKey(dispute.createdAt);
    monthCounts.set(monthKey, (monthCounts.get(monthKey) ?? 0) + 1);
  });

  // Convert map to TimestampCounter
  const result: TimestampCounter = {};
  for (const [monthKey, count] of monthCounts.entries()) {
    result[String(monthKey)] = count;
  }

  return result;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS };
  }

  const chainId = event.queryStringParameters?.chainId as ChainId | undefined;

  if (!chainId || !["1", "100", "42161"].includes(chainId)) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "Invalid or missing chainId. Supported: 1, 100, 42161",
      }),
    };
  }

  try {
    const txData: TimestampCounter =
      chainId === "42161"
        ? await fetchTransactionsV2()
        : await fetchTransactionsV1(chainId);

    // CRITICAL: wrap in { tx: ... } per spec
    // Frontend hook does JSON.parse(res.data)['tx']
    const result = { tx: txData };

    return {
      statusCode: 200,
      headers: { ...JSON_HEADERS, ...CORS_HEADERS, ...CACHE_HEADERS },
      body: JSON.stringify({ data: result }),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      statusCode: 503,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: `Failed to fetch transactions: ${message}`,
      }),
    };
  }
};

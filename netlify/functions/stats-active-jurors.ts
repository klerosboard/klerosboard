import { Handler } from "@netlify/functions";
import { ChainId, TimestampCounter } from "./_shared/types";
import { generateMonthlySnapshots } from "./_shared/monthly-generator";
import {
  getBlockForTimestamp,
  chainIdToDefiLlama,
} from "./_shared/block-resolver";
import { querySubgraph, getSubgraphEndpoint } from "./_shared/subgraph-client";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, max-age=3600",
};

/**
 * Fetch active jurors for v1 chains (Ethereum, Gnosis).
 * Block-by-block resolution via DefiLlama, batched subgraph queries.
 */
async function fetchActiveJurorsV1(chainId: "1" | "100"): Promise<TimestampCounter> {
  const snapshots = generateMonthlySnapshots(chainId);
  const defiLlamaChain = chainIdToDefiLlama(chainId);
  const subgraphEndpoint = getSubgraphEndpoint(chainId);

  // Batch block resolution (max 10 per request to DefiLlama)
  const blocks: Map<number, number | null> = new Map();
  for (let i = 0; i < snapshots.length; i += 10) {
    const batch = snapshots.slice(i, i + 10);
    const blockResults = await Promise.allSettled(
      batch.map((snap) => getBlockForTimestamp(defiLlamaChain, snap.timestamp))
    );

    batch.forEach((snap, idx) => {
      const result = blockResults[idx];
      if (result.status === "fulfilled") {
        blocks.set(snap.timestampMs, result.value);
      } else {
        blocks.set(snap.timestampMs, null);
      }
    });
  }

  // Batch subgraph queries (max 10 in parallel)
  const query = `
    query ActiveJurors($block: Int!) {
      klerosCounter(id: "ID", block: { number: $block }) {
        activeJurors
      }
    }
  `;

  const result: TimestampCounter = {};
  const blockEntries = Array.from(blocks.entries());

  for (let i = 0; i < blockEntries.length; i += 10) {
    const batch = blockEntries.slice(i, i + 10);
    const queryResults = await Promise.allSettled(
      batch.map(([_, blockNumber]) =>
        blockNumber !== null
          ? querySubgraph<{ klerosCounter: { activeJurors: string } }>(
              subgraphEndpoint,
              query,
              { block: blockNumber }
            )
          : Promise.reject(new Error("No block number"))
      )
    );

    batch.forEach(([timestampMs], idx) => {
      const queryResult = queryResults[idx];
      if (queryResult.status === "fulfilled") {
        const activeJurors = queryResult.value.klerosCounter.activeJurors;
        result[String(timestampMs)] = Number(activeJurors);
      }
      // If failed, omit from result (per spec)
    });
  }

  return result;
}

/**
 * Fetch active jurors for v2 (Arbitrum).
 * Single Counter snapshots query.
 */
async function fetchActiveJurorsV2(): Promise<TimestampCounter> {
  const subgraphEndpoint = getSubgraphEndpoint("42161");

  const query = `
    query {
      counters(orderBy: id, orderDirection: asc, first: 1000) {
        id
        activeJurors
      }
    }
  `;

  const data = await querySubgraph<{
    counters: Array<{ id: string; activeJurors: string }>;
  }>(subgraphEndpoint, query);

  const result: TimestampCounter = {};

  data.counters.forEach((counter) => {
    // Exclude id == "0" (current snapshot, not historical)
    if (counter.id !== "0") {
      const timestamp = Number(counter.id);
      const timestampMs = timestamp * 1000;
      result[String(timestampMs)] = Number(counter.activeJurors);
    }
  });

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
    const resultData: TimestampCounter =
      chainId === "42161"
        ? await fetchActiveJurorsV2()
        : await fetchActiveJurorsV1(chainId);

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, ...CACHE_HEADERS },
      body: JSON.stringify({ data: JSON.stringify(resultData) }),
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : String(err);
    return {
      statusCode: 503,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: `Failed to fetch active jurors: ${message}`,
      }),
    };
  }
};

import { Handler } from "@netlify/functions";
import { ChainId, TimestampCounter, MonthSnapshot } from "./_shared/types";
import { generateMonthlySnapshots } from "./_shared/monthly-generator";
import {
  fetchAllStakeSets,
  getSubgraphEndpoint,
  StakeEvent,
} from "./_shared/subgraph-client";

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
 * Reconstruct monthly snapshots of active jurors by replaying stakeSets.
 * Algorithm:
 *   For each month:
 *     1. Advance all events with timestamp <= month end
 *     2. Track latest stake for each juror (Map<address, bigint>)
 *     3. activeJurors = count of jurors with stake > 0
 */
function buildMonthlyActiveJurors(
  events: StakeEvent[],
  months: MonthSnapshot[]
): Array<{
  timestampMs: number;
  activeJurors: number;
}> {
  const results: Array<{
    timestampMs: number;
    activeJurors: number;
  }> = [];

  const jurorState = new Map<string, bigint>(); // address → newTotalStake (most recent)
  let eventIdx = 0;

  for (const month of months) {
    // Month end = start of NEXT month (exclusive upper bound)
    const monthEndTimestamp = getNextMonthTimestamp(month.timestamp);

    // Advance all events that occurred by month end
    while (eventIdx < events.length && events[eventIdx].timestamp < monthEndTimestamp) {
      const ev = events[eventIdx];
      jurorState.set(ev.address, ev.newTotalStake);
      eventIdx++;
    }

    // Count active jurors (stake > 0)
    let activeJurors = 0;
    for (const [, stake] of jurorState) {
      if (stake > 0n) {
        activeJurors++;
      }
    }

    results.push({
      timestampMs: month.timestampMs,
      activeJurors,
    });
  }

  return results;
}

/**
 * Get the unix timestamp for the start of the next month (exclusive upper bound for current month).
 */
function getNextMonthTimestamp(monthStartTimestamp: number): number {
  const d = new Date(monthStartTimestamp * 1000);
  // Set to first of next month
  d.setUTCMonth(d.getUTCMonth() + 1);
  return Math.floor(d.getTime() / 1000);
}

/**
 * Fetch active jurors for v1 chains (Ethereum, Gnosis).
 * Strategy: replay all stakeSets from genesis, reconstruct monthly snapshots.
 */
async function fetchActiveJurorsV1(chainId: "1" | "100"): Promise<TimestampCounter> {
  const subgraphEndpoint = getSubgraphEndpoint(chainId);

  // Fetch all stakeSets from genesis
  const events = await fetchAllStakeSets(subgraphEndpoint);

  // Derive genesis from earliest event timestamp
  const earliestTs = events.reduce(
    (min, e) => Math.min(min, e.timestamp),
    events[0]?.timestamp ?? 0,
  );
  const months = generateMonthlySnapshots(chainId, earliestTs);

  // Reconstruct monthly snapshots
  const snapshots = buildMonthlyActiveJurors(events, months);

  // Convert to TimestampCounter
  const result: TimestampCounter = {};
  for (const snap of snapshots) {
    result[String(snap.timestampMs)] = snap.activeJurors;
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

  const data = await fetch(subgraphEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VITE_GRAPHQL_TOKEN}`,
    },
    body: JSON.stringify({ query }),
  }).then((r) => r.json() as Promise<{
    data?: { counters: Array<{ id: string; activeJurors: string }> };
  }>);

  if (!data.data?.counters) {
    throw new Error("Failed to fetch Counter snapshots for v2");
  }

  const result: TimestampCounter = {};

  data.data.counters.forEach((counter) => {
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
      headers: { ...JSON_HEADERS, ...CORS_HEADERS, ...CACHE_HEADERS },
      body: JSON.stringify({ data: resultData }),
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

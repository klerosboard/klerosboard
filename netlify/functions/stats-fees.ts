import { Handler } from "@netlify/functions";
import { ChainId, TimestampCounter, FeesPaid } from "./_shared/types";
import { generateMonthlySnapshots } from "./_shared/monthly-generator";
import {
  getBlockForTimestamp,
  chainIdToDefiLlama,
} from "./_shared/block-resolver";
import { querySubgraph, getSubgraphEndpoint } from "./_shared/subgraph-client";
import { getEthPriceAtMonthForChain } from "./_shared/price-client";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, max-age=3600",
};

/**
 * Fetch ETH fees for v1 chains (Ethereum, Gnosis).
 * cumulative totalETHFees from KlerosCounter → monthly delta.
 * USD price via DefiLlama (or 1.0 for Gnosis xDAI).
 */
async function fetchFeesV1(chainId: "1" | "100"): Promise<FeesPaid> {
  const snapshots = generateMonthlySnapshots(chainId);
  const defiLlamaChain = chainIdToDefiLlama(chainId);
  const subgraphEndpoint = getSubgraphEndpoint(chainId);

  // Batch block resolution
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

  // Batch subgraph queries to get cumulative totalETHFees
  const query = `
    query GetFees($block: Int!) {
      klerosCounter(id: "ID", block: { number: $block }) {
        totalETHFees
      }
    }
  `;

  const feesByMonth: Map<number, bigint> = new Map();
  const blockEntries = Array.from(blocks.entries());

  for (let i = 0; i < blockEntries.length; i += 10) {
    const batch = blockEntries.slice(i, i + 10);
    const queryResults = await Promise.allSettled(
      batch.map(([_, blockNumber]) =>
        blockNumber !== null
          ? querySubgraph<{ klerosCounter: { totalETHFees: string } }>(
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
        const totalETHFees = BigInt(queryResult.value.klerosCounter.totalETHFees);
        feesByMonth.set(timestampMs, totalETHFees);
      }
    });
  }

  // Compute monthly deltas (first snapshot is omitted)
  const ethAmount: TimestampCounter = {};
  const months = Array.from(feesByMonth.entries()).sort((a, b) => a[0] - b[0]);

  for (let i = 1; i < months.length; i++) {
    const [prevTimestampMs, prevFees] = months[i - 1];
    const [currTimestampMs, currFees] = months[i];
    const delta = currFees - prevFees;
    const eth = Number(delta) / 1e18; // Convert from wei to ETH
    ethAmount[String(currTimestampMs)] = eth;
  }

  // Fetch USD prices for months with fees
  const ethAmountUsd: TimestampCounter = {};

  for (const timestampMsStr of Object.keys(ethAmount)) {
    const timestampMs = Number(timestampMsStr);
    const date = new Date(timestampMs);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();

    try {
      const ethPrice = await getEthPriceAtMonthForChain(year, month, chainId);
      const eth = ethAmount[timestampMsStr];
      ethAmountUsd[timestampMsStr] = eth * ethPrice;
    } catch (err) {
      // If price fetch fails, omit this month from USD (per spec)
      // Still keep ETHAmount
    }
  }

  return { ETHAmount: ethAmount, ETHAmount_usd: ethAmountUsd };
}

/**
 * Fetch ETH fees for v2 (Arbitrum).
 * Counter.paidETH is cumulative per Counter id (timestamp).
 * Monthly delta computed same way as v1.
 */
async function fetchFeesV2(): Promise<FeesPaid> {
  const subgraphEndpoint = getSubgraphEndpoint("42161");

  const query = `
    query {
      counters(orderBy: id, orderDirection: asc, first: 1000) {
        id
        paidETH
      }
    }
  `;

  const data = await querySubgraph<{
    counters: Array<{ id: string; paidETH: string }>;
  }>(subgraphEndpoint, query);

  // Exclude id == "0" (current snapshot)
  const validCounters = data.counters
    .filter((c) => c.id !== "0")
    .map((c) => ({
      timestampMs: Number(c.id) * 1000, // Convert unix seconds to ms
      paidETH: BigInt(c.paidETH),
    }))
    .sort((a, b) => a.timestampMs - b.timestampMs);

  // Compute monthly deltas
  const ethAmount: TimestampCounter = {};

  for (let i = 1; i < validCounters.length; i++) {
    const prev = validCounters[i - 1];
    const curr = validCounters[i];
    const delta = curr.paidETH - prev.paidETH;
    const eth = Number(delta) / 1e18;
    ethAmount[String(curr.timestampMs)] = eth;
  }

  // For v2, fetch USD prices (Arbitrum uses real ETH price from DefiLlama)
  const ethAmountUsd: TimestampCounter = {};

  for (const timestampMsStr of Object.keys(ethAmount)) {
    const timestampMs = Number(timestampMsStr);
    const date = new Date(timestampMs);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();

    try {
      // v2 is Arbitrum, chainId="42161" → not "100", so real ETH price
      const ethPrice = await getEthPriceAtMonthForChain(year, month, "1" as any); // Use mainnet price for Arbitrum
      const eth = ethAmount[timestampMsStr];
      ethAmountUsd[timestampMsStr] = eth * ethPrice;
    } catch (err) {
      // If price fetch fails, omit from USD
    }
  }

  return { ETHAmount: ethAmount, ETHAmount_usd: ethAmountUsd };
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
    const resultData: FeesPaid =
      chainId === "42161" ? await fetchFeesV2() : await fetchFeesV1(chainId);

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, ...CACHE_HEADERS },
      body: JSON.stringify({ data: JSON.stringify(resultData) }),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      statusCode: 503,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: `Failed to fetch fees: ${message}`,
      }),
    };
  }
};

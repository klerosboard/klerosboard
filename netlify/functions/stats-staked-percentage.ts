import { Handler } from "@netlify/functions";
import { ChainId, PNKStakedSerie, TimestampCounter } from "./_shared/types";
import { generateMonthlySnapshots } from "./_shared/monthly-generator";
import {
  getBlockForTimestamp,
  chainIdToDefiLlama,
} from "./_shared/block-resolver";
import {
  querySubgraph,
  getSubgraphEndpoint,
  getPNKTotalSupply,
} from "./_shared/subgraph-client";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, max-age=3600",
};

/**
 * Fetch staked PNK percentage for v1 chains (Ethereum, Gnosis).
 * Block-by-block resolution, compute percentage in Wei to avoid precision loss.
 */
async function fetchStakedPercentageV1(chainId: "1" | "100"): Promise<PNKStakedSerie> {
  const snapshots = generateMonthlySnapshots(chainId);
  const defiLlamaChain = chainIdToDefiLlama(chainId);
  const subgraphEndpoint = getSubgraphEndpoint(chainId);

  // Fetch totalSupply once (cached globally)
  const totalSupply = await getPNKTotalSupply();

  // Batch block resolution (max 10 per request)
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

  // Batch subgraph queries for tokenStaked (max 10 in parallel)
  const query = `
    query TokenStaked($block: Int!) {
      klerosCounter(id: "ID", block: { number: $block }) {
        tokenStaked
      }
    }
  `;

  const result: PNKStakedSerie = {
    total_staked: {},
    total_supply: {},
    percentage: {},
  };

  const blockEntries = Array.from(blocks.entries());

  for (let i = 0; i < blockEntries.length; i += 10) {
    const batch = blockEntries.slice(i, i + 10);
    const queryResults = await Promise.allSettled(
      batch.map(([_, blockNumber]) =>
        blockNumber !== null
          ? querySubgraph<{ klerosCounter: { tokenStaked: string } }>(
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
        const tokenStakedWei = BigInt(queryResult.value.klerosCounter.tokenStaked);

        // Convert from Wei to PNK (1e18)
        const stakedPNK = Number(tokenStakedWei) / 1e18;
        const supplyPNK = Number(totalSupply) / 1e18;

        // Percentage computed in Wei to avoid precision loss
        const percentageRatio = Number(tokenStakedWei) / Number(totalSupply);

        const key = String(timestampMs);
        result.total_staked[key] = stakedPNK;
        result.total_supply[key] = supplyPNK;
        result.percentage[key] = percentageRatio;
      }
      // If failed, omit from result (per spec)
    });
  }

  return result;
}

/**
 * Fetch staked PNK percentage for v2 (Arbitrum).
 * Single Counter snapshots query with stakedPNK.
 */
async function fetchStakedPercentageV2(): Promise<PNKStakedSerie> {
  const subgraphEndpoint = getSubgraphEndpoint("42161");

  // Fetch totalSupply once (cached globally)
  const totalSupply = await getPNKTotalSupply();

  const query = `
    query {
      counters(orderBy: id, orderDirection: asc, first: 1000) {
        id
        stakedPNK
      }
    }
  `;

  const data = await querySubgraph<{
    counters: Array<{ id: string; stakedPNK: string }>;
  }>(subgraphEndpoint, query);

  const result: PNKStakedSerie = {
    total_staked: {},
    total_supply: {},
    percentage: {},
  };

  data.counters.forEach((counter) => {
    const timestamp = Number(counter.id);
    const timestampMs = timestamp * 1000;

    const stakedPNKWei = BigInt(counter.stakedPNK);

    // Convert from Wei to PNK (1e18)
    const stakedPNK = Number(stakedPNKWei) / 1e18;
    const supplyPNK = Number(totalSupply) / 1e18;

    // Percentage computed in Wei to avoid precision loss
    const percentageRatio = Number(stakedPNKWei) / Number(totalSupply);

    const key = String(timestampMs);
    result.total_staked[key] = stakedPNK;
    result.total_supply[key] = supplyPNK;
    result.percentage[key] = percentageRatio;
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
    const resultData: PNKStakedSerie =
      chainId === "42161"
        ? await fetchStakedPercentageV2()
        : await fetchStakedPercentageV1(chainId);

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
        error: `Failed to fetch staked percentage: ${message}`,
      }),
    };
  }
};

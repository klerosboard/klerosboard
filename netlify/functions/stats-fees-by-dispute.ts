import { Handler } from '@netlify/functions';
import { getSubgraphEndpoint, querySubgraph } from './_shared/subgraph-client';
import { getEthPriceAtMonthForChain } from './_shared/price-client';
import { ChainId } from './_shared/types';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=86400, max-age=3600',
};

interface FeesByDisputeItem {
  disputeId: string;
  arbitrableId: string;
  ethAmount: number;
  usdAmount: number;
  timestamp: number;
}

/** Month key used for grouping price lookups. */
function monthKey(ts: number): string {
  const d = new Date(ts * 1000);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
}

const MAX_PAGES = 1000;

interface Shift {
  ETHAmount: string;
  timestamp: string;
}

/**
 * Fetch all TokenAndETHShifts for a single dispute, paginating if the
 * initial nested fetch hit the 1000-item cap.
 */
async function fetchAllShiftsForDispute(
  subgraphEndpoint: string,
  disputeId: string,
  initialShifts: Shift[],
): Promise<Shift[]> {
  if (initialShifts.length < 1000) return initialShifts;

  const all: Shift[] = [...initialShifts];
  let skip = 1000;

  for (let page = 1; page < MAX_PAGES; page++) {
    const query = `
      query ShiftsForDispute($disputeId: String!, $first: Int!, $skip: Int!) {
        tokenAndETHShifts(
          first: $first
          skip: $skip
          where: { dispute: $disputeId, ETHAmount_gt: "0" }
        ) {
          ETHAmount
          timestamp
        }
      }
    `;

    const data = await querySubgraph<{ tokenAndETHShifts: Shift[] }>(subgraphEndpoint, query, {
      disputeId,
      first: 1000,
      skip,
    });

    const shifts = data.tokenAndETHShifts ?? [];
    all.push(...shifts);
    if (shifts.length < 1000) break;
    skip += 1000;
  }

  return all;
}

/**
 * Pre-warm the price cache for all unique (year, month) pairs found in the
 * given timestamps. Uses Promise.all so all months are fetched in parallel.
 * Individual failures set the price to 0 (dispute will have usdAmount=0).
 */
async function prefetchPrices(timestamps: number[], chainId: '1' | '100' | '42161'): Promise<Map<string, number>> {
  const unique = new Map<string, { year: number; month: number }>();
  for (const ts of timestamps) {
    const key = monthKey(ts);
    if (!unique.has(key)) {
      const d = new Date(ts * 1000);
      unique.set(key, { year: d.getUTCFullYear(), month: d.getUTCMonth() });
    }
  }

  const priceMap = new Map<string, number>();
  await Promise.all(
    [...unique.entries()].map(async ([key, { year, month }]) => {
      try {
        const price = await getEthPriceAtMonthForChain(year, month, chainId);
        priceMap.set(key, price);
      } catch {
        // Graceful degradation: usdAmount = 0 for this month
        priceMap.set(key, 0);
      }
    }),
  );

  return priceMap;
}

/**
 * v1 (Ethereum, Gnosis): fees live in Dispute.TokenAndETHShifts[].
 * We paginate all disputes, sum ETHAmount > 0 per dispute, and keep the
 * earliest shift timestamp as the dispute fee timestamp.
 *
 * Prices are pre-fetched in parallel for all unique months before computing
 * usdAmount, avoiding the serial-per-dispute DefiLlama bottleneck.
 */
async function fetchFeesByDisputeV1(chainId: '1' | '100'): Promise<FeesByDisputeItem[]> {
  const subgraphEndpoint = getSubgraphEndpoint(chainId);

  // Pass 1: paginate all disputes and accumulate raw data
  interface RawDispute {
    id: string;
    arbitrableId: string;
    totalWei: bigint;
    minTimestamp: number;
  }

  const raw: RawDispute[] = [];
  let lastId = '';

  for (let page = 0; page < MAX_PAGES; page++) {
    const query = `
      query DisputesWithFees($first: Int, $id_gt: ID) {
        disputes(
          first: $first
          where: { id_gt: $id_gt }
          orderBy: id
          orderDirection: asc
        ) {
          id
          arbitrable { id }
          TokenAndETHShifts(first: 1000, where: { ETHAmount_gt: "0" }) {
            ETHAmount
            timestamp
          }
        }
      }
    `;

    const data = await querySubgraph<{
      disputes: Array<{
        id: string;
        arbitrable: { id: string };
        TokenAndETHShifts: Array<{ ETHAmount: string; timestamp: string }>;
      }>;
    }>(subgraphEndpoint, query, { first: 1000, id_gt: lastId });

    const disputes = data.disputes ?? [];
    for (const dispute of disputes) {
      const initialShifts = dispute.TokenAndETHShifts ?? [];
      if (initialShifts.length === 0) continue;

      const shifts = await fetchAllShiftsForDispute(subgraphEndpoint, dispute.id, initialShifts);

      let totalWei = 0n;
      let minTimestamp = Number.MAX_SAFE_INTEGER;
      for (const shift of shifts) {
        totalWei += BigInt(shift.ETHAmount);
        const ts = Number(shift.timestamp);
        if (ts < minTimestamp) minTimestamp = ts;
      }

      raw.push({ id: dispute.id, arbitrableId: dispute.arbitrable.id, totalWei, minTimestamp });
    }

    if (disputes.length < 1000) break;
    lastId = disputes[disputes.length - 1].id;
  }

  // Pass 2: pre-fetch all unique month prices in parallel
  const priceMap = await prefetchPrices(
    raw.map((d) => d.minTimestamp),
    chainId,
  );

  // Pass 3: compute results
  return raw.map(({ id, arbitrableId, totalWei, minTimestamp }) => {
    const ethAmount = Number(totalWei) / 1e18;
    const price = priceMap.get(monthKey(minTimestamp)) ?? 0;
    return {
      disputeId: id,
      arbitrableId,
      ethAmount,
      usdAmount: ethAmount * price,
      timestamp: minTimestamp,
    };
  });
}

/**
 * v2 (Arbitrum): fees live in Dispute.rounds[].totalFeesForJurors.
 * We paginate all disputes and sum fees per dispute. createdAt is used as
 * the dispute timestamp.
 *
 * Prices are pre-fetched in parallel for all unique months.
 */
async function fetchFeesByDisputeV2(): Promise<FeesByDisputeItem[]> {
  const subgraphEndpoint = getSubgraphEndpoint('42161');

  interface RawDispute {
    id: string;
    arbitrableId: string;
    totalWei: bigint;
    timestamp: number;
  }

  const raw: RawDispute[] = [];
  let lastId = '';

  for (let page = 0; page < MAX_PAGES; page++) {
    const query = `
      query DisputesWithFeesV2($first: Int, $id_gt: ID) {
        disputes(
          first: $first
          where: { id_gt: $id_gt }
          orderBy: id
          orderDirection: asc
        ) {
          id
          arbitrated { id }
          createdAt
          rounds(first: 1000) {
            totalFeesForJurors
          }
        }
      }
    `;

    const data = await querySubgraph<{
      disputes: Array<{
        id: string;
        arbitrated: { id: string };
        createdAt?: string | null;
        rounds: Array<{ totalFeesForJurors: string }>;
      }>;
    }>(subgraphEndpoint, query, { first: 1000, id_gt: lastId });

    const disputes = data.disputes ?? [];
    for (const dispute of disputes) {
      if (!dispute.rounds || dispute.rounds.length === 0) continue;

      let totalWei = 0n;
      for (const round of dispute.rounds) {
        totalWei += BigInt(round.totalFeesForJurors);
      }
      if (totalWei === 0n) continue;

      raw.push({
        id: dispute.id,
        arbitrableId: dispute.arbitrated.id,
        totalWei,
        timestamp: dispute.createdAt ? Number(dispute.createdAt) : 0,
      });
    }

    if (disputes.length < 1000) break;
    lastId = disputes[disputes.length - 1].id;
  }

  // Pre-fetch prices for all unique months (skip ts=0)
  const priceMap = await prefetchPrices(
    raw.filter((d) => d.timestamp > 0).map((d) => d.timestamp),
    '42161',
  );

  return raw.map(({ id, arbitrableId, totalWei, timestamp }) => {
    const ethAmount = Number(totalWei) / 1e18;
    const price = timestamp > 0 ? (priceMap.get(monthKey(timestamp)) ?? 0) : 0;
    return {
      disputeId: id,
      arbitrableId,
      ethAmount,
      usdAmount: ethAmount * price,
      timestamp,
    };
  });
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS };
  }

  const chainId = event.queryStringParameters?.chainId as ChainId | undefined;

  if (!chainId || !['1', '100', '42161'].includes(chainId)) {
    return {
      statusCode: 400,
      headers: { ...JSON_HEADERS, ...CORS_HEADERS },
      body: JSON.stringify({
        error: 'Invalid or missing chainId. Supported: 1, 100, 42161',
      }),
    };
  }

  try {
    const resultData = chainId === '42161' ? await fetchFeesByDisputeV2() : await fetchFeesByDisputeV1(chainId);

    return {
      statusCode: 200,
      headers: { ...JSON_HEADERS, ...CORS_HEADERS, ...CACHE_HEADERS },
      body: JSON.stringify({ data: resultData }),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      statusCode: 503,
      headers: { ...JSON_HEADERS, ...CORS_HEADERS },
      body: JSON.stringify({
        error: `Failed to fetch fees by dispute: ${message}`,
      }),
    };
  }
};

import { Handler } from '@netlify/functions';
import { generateMonthlySnapshots } from './_shared/monthly-generator';
import { getEthPriceAtMonthForChain } from './_shared/price-client';
import { getSubgraphEndpoint, querySubgraph } from './_shared/subgraph-client';
import { ChainId, FeesPaid, TimestampCounter } from './_shared/types';

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

// Module-level cache + lock: keyed by endpoint, TTL 10 minutes
const shiftsCache = new Map<string, { data: Array<{ timestamp: number; ethAmount: bigint }>; expiresAt: number }>();
const shiftsLocks = new Map<string, Promise<Array<{ timestamp: number; ethAmount: bigint }>>>();

/**
 * Fetch all tokenAndETHShifts events for a v1 chain via cursor pagination.
 * Filters ETHAmount_gt: "0" to skip zero-ETH shifts.
 * Returns events sorted by timestamp (ascending).
 * Results are cached in-memory for 10 minutes.
 * Concurrent calls for the same endpoint share one pagination run via lock.
 */
async function fetchAllTokenAndETHShifts(
  subgraphEndpoint: string,
): Promise<Array<{ timestamp: number; ethAmount: bigint }>> {
  // Check cache first
  const cached = shiftsCache.get(subgraphEndpoint);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // Deduplicate concurrent calls — share one in-flight promise per endpoint
  const inflight = shiftsLocks.get(subgraphEndpoint);
  if (inflight) return inflight;

  const promise = (async (): Promise<Array<{ timestamp: number; ethAmount: bigint }>> => {
    const allEvents: Array<{ timestamp: number; ethAmount: bigint }> = [];
    let lastTimestamp = 0;

    while (true) {
      const query = `
      query TokenAndETHShifts($lastTimestamp: Int!) {
        tokenAndETHShifts(
          first: 1000
          orderBy: timestamp
          orderDirection: asc
          where: { ETHAmount_gt: "0", timestamp_gt: $lastTimestamp }
        ) {
          id
          timestamp
          ETHAmount
        }
      }
    `;

      const data = await querySubgraph<{
        tokenAndETHShifts: Array<{
          id: string;
          timestamp: string;
          ETHAmount: string;
        }>;
      }>(subgraphEndpoint, query, { lastTimestamp });

      const items = data.tokenAndETHShifts;
      if (!items || items.length === 0) break;

      for (const item of items) {
        allEvents.push({
          timestamp: Number(item.timestamp),
          ethAmount: BigInt(item.ETHAmount),
        });
      }

      if (items.length < 1000) break;

      // Advance cursor to last timestamp for next batch
      lastTimestamp = Number(items[items.length - 1].timestamp);
    }

    // Cache for 10 minutes
    shiftsCache.set(subgraphEndpoint, { data: allEvents, expiresAt: Date.now() + 10 * 60 * 1000 });

    return allEvents;
  })();

  // Register the in-flight promise and clean up when done
  shiftsLocks.set(subgraphEndpoint, promise);
  promise.finally(() => shiftsLocks.delete(subgraphEndpoint));

  return promise;
}

/**
 * Fetch ETH fees for v1 chains (Ethereum, Gnosis).
 * Strategy: paginate all tokenAndETHShifts events, group by month,
 * sum ETH per month, convert to USD.
 */
async function fetchFeesV1(chainId: '1' | '100'): Promise<FeesPaid> {
  const subgraphEndpoint = getSubgraphEndpoint(chainId);
  const snapshots = generateMonthlySnapshots(chainId);

  // Build a set of month start timestamps (ms) for grouping
  const validMonths = new Set(snapshots.map((s) => s.timestampMs));

  // Fetch all tokenAndETHShifts events
  const events = await fetchAllTokenAndETHShifts(subgraphEndpoint);

  // Group by month and sum ETHAmount
  const ethPerMonth: Map<number, bigint> = new Map();

  for (const event of events) {
    // Convert event timestamp to month key (ms timestamp of first of month)
    const d = new Date(event.timestamp * 1000);
    const monthKey = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);

    // Only include months in our valid range
    if (validMonths.has(monthKey)) {
      const current = ethPerMonth.get(monthKey) ?? 0n;
      ethPerMonth.set(monthKey, current + event.ethAmount);
    }
  }

  // Convert to TimestampCounter (wei → ETH)
  const ethAmount: TimestampCounter = {};
  for (const [monthKey, totalWei] of ethPerMonth.entries()) {
    ethAmount[String(monthKey)] = Number(totalWei) / 1e18;
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
    } catch (_) {
      // If price fetch fails, omit this month from USD (per spec)
    }
  }

  return { ETHAmount: ethAmount, ETHAmount_usd: ethAmountUsd };
}

/**
 * Fetch ETH fees for v2 (Arbitrum).
 * Counter.paidETH is cumulative per Counter id (timestamp).
 * Monthly delta computed same way as before.
 */
async function fetchFeesV2(): Promise<FeesPaid> {
  const subgraphEndpoint = getSubgraphEndpoint('42161');

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
    .filter((c) => c.id !== '0')
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
      // v2 is Arbitrum — use mainnet ETH price
      const ethPrice = await getEthPriceAtMonthForChain(year, month, '1');
      const eth = ethAmount[timestampMsStr];
      ethAmountUsd[timestampMsStr] = eth * ethPrice;
    } catch (_) {
      // If price fetch fails, omit from USD
    }
  }

  return { ETHAmount: ethAmount, ETHAmount_usd: ethAmountUsd };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS };
  }

  const chainId = event.queryStringParameters?.chainId as ChainId | undefined;

  if (!chainId || !['1', '100', '42161'].includes(chainId)) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Invalid or missing chainId. Supported: 1, 100, 42161',
      }),
    };
  }

  try {
    const resultData: FeesPaid = chainId === '42161' ? await fetchFeesV2() : await fetchFeesV1(chainId);

    return {
      statusCode: 200,
      headers: { ...JSON_HEADERS, ...CORS_HEADERS, ...CACHE_HEADERS },
      body: JSON.stringify({ data: resultData }),
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

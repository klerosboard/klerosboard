import { Handler } from '@netlify/functions';
import { ChainId, PNKStakedSerie, MonthSnapshot } from './_shared/types';
import { generateMonthlySnapshots, PNK_SUPPLY_GENESIS } from './_shared/monthly-generator';
import { fetchAllStakeSets, getSubgraphEndpoint, getPNKSupplyAtMonth, StakeEvent } from './_shared/subgraph-client';

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

/**
 * Reconstruct monthly snapshots of staked PNK by replaying stakeSets.
 * Algorithm:
 *   For each month:
 *     1. Advance all events with timestamp <= month end
 *     2. Track latest stake for each juror (Map<address, bigint>)
 *     3. totalStaked = sum of all stakes > 0
 */
function buildMonthlyStakedAmounts(
  events: StakeEvent[],
  months: MonthSnapshot[],
): Array<{
  timestampMs: number;
  totalStaked: bigint;
}> {
  const results: Array<{
    timestampMs: number;
    totalStaked: bigint;
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

    // Sum all stakes > 0
    let totalStaked = 0n;
    for (const [, stake] of jurorState) {
      if (stake > 0n) {
        totalStaked += stake;
      }
    }

    results.push({
      timestampMs: month.timestampMs,
      totalStaked,
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
 * Fetch staked PNK percentage for v1 chains (Ethereum, Gnosis).
 *
 * Two independent series are built and returned together:
 *
 * - total_supply: starts from PNK contract genesis (March 2018), covers the
 *   full minting/burning history regardless of when staking began.
 *
 * - total_staked / percentage: start from the first stakeSet event so that
 *   no zero-stake months appear before jurors were active.
 */
async function fetchStakedPercentageV1(chainId: '1' | '100'): Promise<PNKStakedSerie> {
  const subgraphEndpoint = getSubgraphEndpoint(chainId);

  // Fetch all stakeSets from genesis
  const events = await fetchAllStakeSets(subgraphEndpoint);

  // --- Supply series: full history from PNK contract genesis ---
  const supplyMonths = generateMonthlySnapshots(chainId, undefined, PNK_SUPPLY_GENESIS);

  // --- Staking series: starts from the first stake event ---
  const earliestTs = events.reduce((min, e) => Math.min(min, e.timestamp), events[0]?.timestamp ?? 0);
  const stakeMonths = generateMonthlySnapshots(chainId, earliestTs);

  // Reconstruct monthly snapshots of staked amounts (only for staking months)
  const snapshots = buildMonthlyStakedAmounts(events, stakeMonths);

  const result: PNKStakedSerie = {
    total_staked: {},
    total_supply: {},
    percentage: {},
  };

  // Populate total_supply for the full series from PNK genesis
  for (const month of supplyMonths) {
    const key = String(month.timestampMs);
    const totalSupply = await getPNKSupplyAtMonth(month.timestampMs);
    result.total_supply[key] = Number(totalSupply) / 1e18;
  }

  // Populate total_staked and percentage from the first stake month onward
  for (const snap of snapshots) {
    const key = String(snap.timestampMs);
    const totalSupply = await getPNKSupplyAtMonth(snap.timestampMs);

    result.total_staked[key] = Number(snap.totalStaked) / 1e18;
    // Percentage computed from Wei to avoid precision loss
    result.percentage[key] = totalSupply > 0n ? Number(snap.totalStaked) / Number(totalSupply) : 0;
  }

  return result;
}

/**
 * Fetch staked PNK percentage for v2 (Arbitrum).
 * Single Counter snapshots query with stakedPNK.
 */
async function fetchStakedPercentageV2(): Promise<PNKStakedSerie> {
  const subgraphEndpoint = getSubgraphEndpoint('42161');

  const query = `
    query {
      counters(orderBy: id, orderDirection: asc, first: 1000) {
        id
        stakedPNK
      }
    }
  `;

  const data = await fetch(subgraphEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.VITE_GRAPHQL_TOKEN}`,
    },
    body: JSON.stringify({ query }),
  }).then(
    (r) =>
      r.json() as Promise<{
        data?: { counters: Array<{ id: string; stakedPNK: string }> };
      }>,
  );

  if (!data.data?.counters) {
    throw new Error('Failed to fetch Counter snapshots for v2');
  }

  const result: PNKStakedSerie = {
    total_staked: {},
    total_supply: {},
    percentage: {},
  };

  const counters = data.data.counters.filter((counter) => counter.id !== '0' && counter.stakedPNK !== '0');

  for (const counter of counters) {
    const timestampMs = Number(counter.id) * 1000;
    const stakedPNKWei = BigInt(counter.stakedPNK);
    const totalSupply = await getPNKSupplyAtMonth(timestampMs);

    // Convert from Wei to PNK (1e18)
    const stakedPNK = Number(stakedPNKWei) / 1e18;
    const supplyPNK = Number(totalSupply) / 1e18;

    // Percentage computed from Wei to avoid precision loss
    const percentageRatio = totalSupply > 0n ? Number(stakedPNKWei) / Number(totalSupply) : 0;

    const key = String(timestampMs);
    result.total_staked[key] = stakedPNK;
    result.total_supply[key] = supplyPNK;
    result.percentage[key] = percentageRatio;
  }

  return result;
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
    const resultData: PNKStakedSerie =
      chainId === '42161' ? await fetchStakedPercentageV2() : await fetchStakedPercentageV1(chainId);

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
        error: `Failed to fetch staked percentage: ${message}`,
      }),
    };
  }
};

import { ChainId } from './types';

/**
 * Query the subgraph with GraphQL.
 * Timeout: 10 seconds.
 * Auth: Bearer token from GRAPHQL_TOKEN env var.
 */
export async function querySubgraph<T>(
  endpoint: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = process.env.VITE_GRAPHQL_TOKEN;
  if (!token) {
    throw new Error('Missing VITE_GRAPHQL_TOKEN environment variable');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from subgraph`);
    }

    const json = (await response.json()) as {
      data?: T;
      errors?: Array<{ message: string }>;
    };

    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors[0].message);
    }

    if (!json.data) {
      throw new Error('No data returned from subgraph');
    }

    return json.data;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Get subgraph endpoint for a given chain.
 * Reads from env vars: VITE_SUBGRAPH_MAINNET, VITE_SUBGRAPH_GNOSIS, VITE_SUBGRAPH_ARBITRUM.
 */
export function getSubgraphEndpoint(chainId: ChainId): string {
  const endpoints: Record<ChainId, string | undefined> = {
    '1': process.env.VITE_SUBGRAPH_MAINNET,
    '100': process.env.VITE_SUBGRAPH_GNOSIS,
    '42161': process.env.VITE_SUBGRAPH_ARBITRUM,
  };

  const endpoint = endpoints[chainId];
  if (!endpoint) {
    throw new Error(`Missing subgraph endpoint for chainId: ${chainId}`);
  }

  return endpoint;
}

// ---- PNK Supply History ----

const PNK_CONTRACT = '0x93ED3FBe21207Ec2E8f2d3c3de6e058Cb73Bc04d';
// First block where PNK contract exists (~March 2018)
const PNK_GENESIS_BLOCK = '0x527700';
// Transfer(address,address,uint256) topic
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const ZERO_ADDRESS_TOPIC = '0x0000000000000000000000000000000000000000000000000000000000000000';
// getLogs RPCs that support full historical range — tried in order
const LOGS_RPC_URLS = ['https://rpc.eth.gateway.fm', 'https://mainnet.gateway.tenderly.co', 'https://eth.llamarpc.com'];
const SUPPLY_HISTORY_TTL = 7 * 24 * 60 * 60 * 1000; // 1 week in ms

interface SupplyEvent {
  timestampMs: number;
  delta: bigint; // positive = mint, negative = burn
}

interface SupplyHistoryCache {
  events: SupplyEvent[];
  expiresAt: number;
}

let supplyHistoryCache: SupplyHistoryCache | null = null;

/**
 * Fetch a block's timestamp via eth_getBlockByNumber.
 * Tries each RPC in LOGS_RPC_URLS until one succeeds.
 */
async function getBlockTimestamp(blockHex: string): Promise<number> {
  let lastError: Error = new Error('No RPC available for getBlockByNumber');
  for (const rpcUrl of LOGS_RPC_URLS) {
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBlockByNumber',
          params: [blockHex, false],
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = (await response.json()) as { result?: { timestamp: string } };
      if (!json.result) throw new Error(`No block data for ${blockHex}`);
      return parseInt(json.result.timestamp, 16) * 1000; // ms
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError;
}

/**
 * Fetch all PNK mint and burn Transfer events from genesis to latest.
 * Mints: Transfer(from=0x0, to=any) — positive delta.
 * Burns: Transfer(from=any, to=0x0) — negative delta.
 * Uses gateway.fm which supports full historical getLogs without batching.
 * Results are cached in-memory for 1 week (supply changes ~once per year).
 */
async function fetchPNKSupplyEvents(): Promise<SupplyEvent[]> {
  const now = Date.now();
  if (supplyHistoryCache && now < supplyHistoryCache.expiresAt) {
    return supplyHistoryCache.events;
  }

  async function getLogs(
    fromTopic: string | null,
    toTopic: string | null,
  ): Promise<Array<{ blockNumber: string; data: string }>> {
    let lastError: Error = new Error('No getLogs RPC available');
    for (const rpcUrl of LOGS_RPC_URLS) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getLogs',
            params: [
              {
                fromBlock: PNK_GENESIS_BLOCK,
                toBlock: 'latest',
                address: PNK_CONTRACT,
                topics: [TRANSFER_TOPIC, fromTopic, toTopic],
              },
            ],
          }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status} from ${rpcUrl}`);
        const json = (await response.json()) as {
          result?: Array<{ blockNumber: string; data: string }>;
          error?: { message: string };
        };
        if (json.error) throw new Error(`getLogs error from ${rpcUrl}: ${json.error.message}`);
        if (!json.result) throw new Error(`No result from ${rpcUrl}`);
        return json.result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      } finally {
        clearTimeout(timeout);
      }
    }
    throw lastError;
  }

  // Fetch mints and burns in parallel
  const [mintLogs, burnLogs] = await Promise.all([
    getLogs(ZERO_ADDRESS_TOPIC, null), // from=0x0 (mint)
    getLogs(null, ZERO_ADDRESS_TOPIC), // to=0x0 (burn)
  ]);

  // Resolve block timestamps in parallel (deduplicated)
  const uniqueBlocks = new Set([...mintLogs.map((l) => l.blockNumber), ...burnLogs.map((l) => l.blockNumber)]);
  const blockTimestamps = new Map<string, number>();
  await Promise.all(
    Array.from(uniqueBlocks).map(async (blockHex) => {
      const ts = await getBlockTimestamp(blockHex);
      blockTimestamps.set(blockHex, ts);
    }),
  );

  const events: SupplyEvent[] = [
    ...mintLogs.map((l) => ({
      timestampMs: blockTimestamps.get(l.blockNumber) ?? 0,
      delta: BigInt(l.data),
    })),
    ...burnLogs.map((l) => ({
      timestampMs: blockTimestamps.get(l.blockNumber) ?? 0,
      delta: -BigInt(l.data),
    })),
  ].sort((a, b) => a.timestampMs - b.timestampMs);

  supplyHistoryCache = { events, expiresAt: now + SUPPLY_HISTORY_TTL };
  return events;
}

/**
 * Compute PNK total supply at the start of a given month (timestampMs).
 * Sums all mint/burn deltas up to and including that month.
 * Falls back to current on-chain totalSupply if getLogs fails.
 */
export async function getPNKSupplyAtMonth(monthStartMs: number): Promise<bigint> {
  const events = await fetchPNKSupplyEvents();
  let supply = 0n;
  for (const ev of events) {
    if (ev.timestampMs <= monthStartMs) {
      supply += ev.delta;
    } else {
      break; // events are sorted ascending
    }
  }
  return supply;
}

// ---- StakeSet Replay ----

/**
 * StakeEvent from subgraph stakeSets query.
 */
export interface StakeEvent {
  id: string; // entity id
  timestamp: number; // unix seconds
  address: string; // juror address
  newTotalStake: bigint; // stake total after this event (in wei)
}

// Module-level cache + lock for stakeSets: keyed by endpoint, TTL 10 minutes
const stakeSetsCache = new Map<string, { data: StakeEvent[]; expiresAt: number }>();
const stakeSetsLocks = new Map<string, Promise<StakeEvent[]>>();

/**
 * Fetch all stakeSets from subgraph with pagination.
 * Handles cursor pagination (first: 1000, orderBy: id, orderDirection: asc).
 * Returns events sorted by timestamp (ascending).
 * Results are cached in-memory for 10 minutes.
 * Concurrent calls for the same endpoint share one pagination run via lock.
 */
export async function fetchAllStakeSets(endpoint: string): Promise<StakeEvent[]> {
  // Check cache first
  const cached = stakeSetsCache.get(endpoint);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // Deduplicate concurrent calls — share one in-flight promise per endpoint
  const inflight = stakeSetsLocks.get(endpoint);
  if (inflight) return inflight;

  const promise = (async (): Promise<StakeEvent[]> => {
    const events: StakeEvent[] = [];
    let lastId = '';
    let hasMore = true;

    while (hasMore) {
      const query = `
      query StakeSets($lastId: String!) {
        stakeSets(
          first: 1000
          orderBy: id
          orderDirection: asc
          where: { id_gt: $lastId }
        ) {
          id
          timestamp
          address { id }
          newTotalStake
        }
      }
    `;

      const data = await querySubgraph<{
        stakeSets: Array<{
          id: string;
          timestamp: string;
          address: { id: string };
          newTotalStake: string;
        }>;
      }>(endpoint, query, { lastId });

      if (!data.stakeSets || data.stakeSets.length === 0) {
        hasMore = false;
        break;
      }

      for (const stake of data.stakeSets) {
        events.push({
          id: stake.id,
          timestamp: Number(stake.timestamp),
          address: stake.address.id.toLowerCase(),
          newTotalStake: BigInt(stake.newTotalStake),
        });
      }

      // Paginate by id
      lastId = data.stakeSets[data.stakeSets.length - 1].id;

      // If batch < 1000, this is the last page
      if (data.stakeSets.length < 1000) {
        hasMore = false;
      }
    }

    // Ensure sorted by timestamp (events come in id order, not timestamp order)
    events.sort((a, b) => a.timestamp - b.timestamp);

    // Cache for 10 minutes
    stakeSetsCache.set(endpoint, { data: events, expiresAt: Date.now() + 10 * 60 * 1000 });

    return events;
  })();

  // Register the in-flight promise and clean up when done
  stakeSetsLocks.set(endpoint, promise);
  promise.finally(() => stakeSetsLocks.delete(endpoint));

  return promise;
}

import { ChainId } from "./types";

/**
 * Query the subgraph with GraphQL.
 * Timeout: 10 seconds.
 * Auth: Bearer token from GRAPHQL_TOKEN env var.
 */
export async function querySubgraph<T>(
  endpoint: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const token = process.env.GRAPHQL_TOKEN;
  if (!token) {
    throw new Error("Missing GRAPHQL_TOKEN environment variable");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
      throw new Error("No data returned from subgraph");
    }

    return json.data;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Get subgraph endpoint for a given chain.
 * Reads from env vars: SUBGRAPH_MAINNET, SUBGRAPH_GNOSIS, SUBGRAPH_ARBITRUM.
 */
export function getSubgraphEndpoint(chainId: ChainId): string {
  const endpoints: Record<ChainId, string | undefined> = {
    "1": process.env.SUBGRAPH_MAINNET,
    "100": process.env.SUBGRAPH_GNOSIS,
    "42161": process.env.SUBGRAPH_ARBITRUM,
  };

  const endpoint = endpoints[chainId];
  if (!endpoint) {
    throw new Error(`Missing subgraph endpoint for chainId: ${chainId}`);
  }

  return endpoint;
}

// ---- PNK totalSupply Cache ----
let cachedTotalSupply: bigint | null = null;
let cacheExpiresAt = 0;
const SUPPLY_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

/**
 * Get PNK totalSupply from mainnet RPC with 24h cache.
 * Contract: 0x93ED3FBe21207Ec2E8f2d3c3de6e058Cb73Bc04d
 * Method: totalSupply() selector 0x18160ddd
 */
export async function getPNKTotalSupply(): Promise<bigint> {
  const now = Date.now();

  // Return cached value if still valid
  if (cachedTotalSupply !== null && now < cacheExpiresAt) {
    return cachedTotalSupply;
  }

  const rpcUrl = process.env.VITE_WEB3_MAINNET_PROVIDER_URL;
  if (!rpcUrl) {
    throw new Error("Missing VITE_WEB3_MAINNET_PROVIDER_URL environment variable");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [
          {
            to: "0x93ED3FBe21207Ec2E8f2d3c3de6e058Cb73Bc04d",
            data: "0x18160ddd", // totalSupply() selector
          },
          "latest",
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from RPC`);
    }

    const json = (await response.json()) as { result?: string; error?: string };

    if (json.error) {
      throw new Error(`RPC error: ${json.error}`);
    }

    if (!json.result) {
      throw new Error("No result from eth_call");
    }

    const totalSupply = BigInt(json.result);

    // Cache for 24 hours
    cachedTotalSupply = totalSupply;
    cacheExpiresAt = now + SUPPLY_CACHE_TTL;

    return totalSupply;
  } finally {
    clearTimeout(timeout);
  }
}

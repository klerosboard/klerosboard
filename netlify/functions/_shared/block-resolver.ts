import { DefiLlamaChain } from "./types";

/**
 * Resolve block number for a given timestamp via DefiLlama block API.
 * Timeout: 8 seconds per request.
 * Throws on failure — no fallback.
 */
export async function getBlockForTimestamp(
  chain: DefiLlamaChain,
  timestamp: number // unix seconds
): Promise<number> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const url = `https://coins.llama.fi/block/${chain}/${timestamp}`;
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} from DefiLlama block API for ${chain}/${timestamp}`
      );
    }

    const data = (await response.json()) as { height?: number };
    if (data.height === undefined) {
      throw new Error(`DefiLlama returned no height for ${chain}/${timestamp}`);
    }

    return data.height;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Block resolution failed for ${chain} at ${timestamp}: ${reason}`);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Map chainId to DefiLlama chain name.
 */
export function chainIdToDefiLlama(chainId: "1" | "100"): DefiLlamaChain {
  const mapping: Record<"1" | "100", DefiLlamaChain> = {
    "1": "ethereum",
    "100": "gnosis",
  };
  return mapping[chainId];
}

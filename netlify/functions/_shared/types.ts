// Types for Netlify Functions — kleros-stats replacement
// Mirrors src/lib/types.ts, but scoped to functions (no frontend imports)

export type ChainId = "1" | "100" | "42161";
export type SubgraphVersion = "v1" | "v2";
export type DefiLlamaChain = "ethereum" | "gnosis" | "arbitrum";

export interface MonthSnapshot {
  timestamp: number;      // unix seconds, 1st of month 00:00 UTC
  timestampMs: number;    // timestamp * 1000 (for output keys)
  isComplete: boolean;    // true if month is past, false if current (partial) month
}

export interface NetlifyOkResponse<T = unknown> {
  data: string;           // JSON.stringify(T) — matches kleros-stats wire format
}

export interface NetlifyErrorResponse {
  error: string;
}

// Mirrors frontend types for consistency
export interface TimestampCounter {
  [timestampMs: string]: number;
}

export interface PNKStakedSerie {
  total_staked: TimestampCounter;
  total_supply: TimestampCounter;
  percentage: TimestampCounter;
}

export interface FeesPaid {
  ETHAmount: TimestampCounter;
  ETHAmount_usd: TimestampCounter;
}

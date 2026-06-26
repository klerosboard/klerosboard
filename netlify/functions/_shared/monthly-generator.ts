import { MonthSnapshot, ChainId } from "./types";

// Genesis dates: first month with data per chain (hardcoded fallback)
const GENESIS_DATES: Record<"1" | "100", { year: number; month: number }> = {
  "1": { year: 2021, month: 0 },      // January 2021 (Ethereum)
  "100": { year: 2021, month: 9 },    // October 2021 (Gnosis)
};

/**
 * Compute genesis month from the earliest event timestamp.
 * Returns the first day of that month in UTC.
 */
function genesisFromEvent(earliestTimestamp: number): { year: number; month: number } {
  const d = new Date(earliestTimestamp * 1000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

/**
 * Generate monthly snapshots from chain genesis to current month (inclusive).
 * For v1 chains (Ethereum, Gnosis) with historical data.
 * Pass earliestEventTimestamp to derive genesis dynamically from events.
 * Falls back to hardcoded GENESIS_DATES when no event timestamp provided.
 */
export function generateMonthlySnapshots(
  chainId: "1" | "100",
  earliestEventTimestamp?: number,
): MonthSnapshot[] {
  let genesis: { year: number; month: number };

  if (earliestEventTimestamp && earliestEventTimestamp > 0) {
    genesis = genesisFromEvent(earliestEventTimestamp);
  } else {
    genesis = GENESIS_DATES[chainId];
    if (!genesis) {
      throw new Error(`No genesis date defined for chainId: ${chainId}`);
    }
  }

  const snapshots: MonthSnapshot[] = [];
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();

  // Iterate from genesis to current month inclusive
  let year = genesis.year;
  let month = genesis.month;

  while (year < currentYear || (year === currentYear && month <= currentMonth)) {
    // Create date at 1st of month, 00:00 UTC
    const date = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const timestamp = Math.floor(date.getTime() / 1000); // unix seconds
    const timestampMs = date.getTime(); // milliseconds

    const isComplete = year < currentYear || (year === currentYear && month < currentMonth);

    snapshots.push({
      timestamp,
      timestampMs,
      isComplete,
    });

    // Move to next month
    month++;
    if (month === 12) {
      month = 0;
      year++;
    }
  }

  return snapshots;
}

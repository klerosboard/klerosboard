import { MonthSnapshot } from './types';

// Genesis dates: first month with data per chain (hardcoded fallback)
const GENESIS_DATES: Record<'1' | '100', { year: number; month: number }> = {
  '1': { year: 2018, month: 8 }, // September 2018 (Ethereum)
  '100': { year: 2021, month: 6 }, // July 2021 (Gnosis)
};

// PNK contract was deployed in March 2018 (block 5406602).
// This is the genesis for supply history regardless of when staking started.
export const PNK_SUPPLY_GENESIS = { year: 2018, month: 2 } as const; // month=2 → March (0-indexed)

/**
 * Compute genesis month from the earliest event timestamp.
 * Returns the first day of that month in UTC.
 */
function genesisFromEvent(earliestTimestamp: number): {
  year: number;
  month: number;
} {
  const d = new Date(earliestTimestamp * 1000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

/**
 * Generate monthly snapshots from a given genesis to the current month (inclusive).
 * For v1 chains (Ethereum, Gnosis) with historical data.
 *
 * Genesis resolution order:
 *   1. genesisOverride — explicit { year, month } passed by the caller (highest priority).
 *   2. earliestEventTimestamp — derive genesis from the earliest known event.
 *   3. GENESIS_DATES[chainId] — hardcoded fallback per chain.
 */
export function generateMonthlySnapshots(
  chainId: '1' | '100',
  earliestEventTimestamp?: number,
  genesisOverride?: { year: number; month: number },
): MonthSnapshot[] {
  let genesis: { year: number; month: number };

  if (genesisOverride) {
    genesis = genesisOverride;
  } else if (earliestEventTimestamp && earliestEventTimestamp > 0) {
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

/**
 * Price client for ETH historical prices via DefiLlama.
 * Month-based caching to reduce API calls.
 * Gnosis (xDAI) returns 1.0 (assumes 1:1 peg with USD).
 */

const priceCache = new Map<string, number>();

/**
 * Get ETH price at a specific month via DefiLlama.
 * @param year 4-digit year (e.g. 2021)
 * @param month 0-indexed month (0 = Jan, 11 = Dec)
 * @returns ETH price in USD
 */
export async function getEthPriceAtMonth(year: number, month: number): Promise<number> {
  const cacheKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  // Check cache
  if (priceCache.has(cacheKey)) {
    return priceCache.get(cacheKey)!;
  }

  // Start of month, 00:00 UTC
  const date = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const timestamp = Math.floor(date.getTime() / 1000);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const url = `https://coins.llama.fi/prices/historical/${timestamp}/coingecko:ethereum`;
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from DefiLlama price API`);
    }

    const data = (await response.json()) as {
      coins?: Record<string, { price?: number }>;
    };

    const price = data.coins?.["coingecko:ethereum"]?.price;
    if (price === undefined) {
      throw new Error(`No price data for coingecko:ethereum at ${cacheKey}`);
    }

    // Cache for this month
    priceCache.set(cacheKey, price);
    return price;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Get ETH price with Gnosis chain override (xDAI = 1.0).
 * For Gnosis, always returns 1.0 without calling DefiLlama.
 */
export async function getEthPriceAtMonthForChain(
  year: number,
  month: number,
  chainId: "1" | "100"
): Promise<number> {
  if (chainId === "100") {
    // Gnosis uses xDAI with 1:1 USD peg
    return 1.0;
  }
  return getEthPriceAtMonth(year, month);
}

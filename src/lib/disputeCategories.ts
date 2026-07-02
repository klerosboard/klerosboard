import { Dispute } from '../graphql/subgraph';
import { LItem } from '../graphql/subgraph';
import { getArbitrableCategory, UNKNOWN_CATEGORY } from './arbitrableCategories';

/**
 * Resolve the Curate name for an arbitrable address.
 * Scout format: key0 = "eip155:{chainId}:{address}", key1 = name.
 */
function getArbitrableName(arbitrable: string, arbitrableNames: LItem[]): string | undefined {
  const addr = arbitrable.toLowerCase();
  const foundItem = arbitrableNames.find((item) => item.key0?.toLowerCase().includes(addr));
  return foundItem?.key1;
}

/**
 * Build a disputeId → category Map for v1 chains (Mainnet, Gnosis).
 * Uses the Curate Address Tags registry for names, then maps names to
 * categories via the NAME_CATEGORY_MAP / ADDRESS_CATEGORY_MAP.
 */
export function getDisputeCategoriesV1(disputes: Dispute[], arbitrableNames: LItem[] | undefined): Map<string, string> {
  const result = new Map<string, string>();
  for (const dispute of disputes) {
    const address = dispute.arbitrable.id;
    const name = arbitrableNames ? getArbitrableName(address, arbitrableNames) : undefined;
    result.set(dispute.id, getArbitrableCategory(address, name));
  }
  return result;
}

export { UNKNOWN_CATEGORY };

interface CategoryData {
  category: string;
  data_eth: number;
  data_gno: number;
  data_arb: number;
}

/**
 * Aggregate disputes by category across chains.
 * Returns [{ category, data_eth, data_gno, data_arb }] sorted by total count
 * descending.
 *
 * If `topN` is provided, only the top N categories are returned and the rest
 * are grouped under `otherCategory` (defaults to "Other").
 */
export function aggregateByCategory(
  categoriesByChain: Map<string, string>[],
  topN?: number,
  otherCategory = 'Other',
): CategoryData[] {
  const chainKeys: ('data_eth' | 'data_gno' | 'data_arb')[] = ['data_eth', 'data_gno', 'data_arb'];

  const counts: Record<string, { data_eth: number; data_gno: number; data_arb: number; total: number }> = {};
  categoriesByChain.forEach((chainMap, index) => {
    const key = chainKeys[index];
    for (const category of chainMap.values()) {
      if (!counts[category]) {
        counts[category] = { data_eth: 0, data_gno: 0, data_arb: 0, total: 0 };
      }
      counts[category][key]++;
      counts[category].total++;
    }
  });

  let sorted = Object.entries(counts)
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.total - a.total);

  if (!topN || sorted.length <= topN) {
    return sorted.map(({ category, data_eth, data_gno, data_arb }) => ({ category, data_eth, data_gno, data_arb }));
  }

  const top = sorted.slice(0, topN);
  const rest = sorted.slice(topN);
  const otherTotal = {
    category: otherCategory,
    data_eth: rest.reduce((sum, item) => sum + item.data_eth, 0),
    data_gno: rest.reduce((sum, item) => sum + item.data_gno, 0),
    data_arb: rest.reduce((sum, item) => sum + item.data_arb, 0),
    total: 0,
  };
  otherTotal.total = otherTotal.data_eth + otherTotal.data_gno + otherTotal.data_arb;

  // If the "Other" bucket is already in the top N, merge the rest into it
  // instead of creating a duplicate category, then re-sort.
  const otherIndex = top.findIndex((item) => item.category === otherCategory);
  if (otherIndex >= 0) {
    top[otherIndex].data_eth += otherTotal.data_eth;
    top[otherIndex].data_gno += otherTotal.data_gno;
    top[otherIndex].data_arb += otherTotal.data_arb;
    top[otherIndex].total += otherTotal.total;
    sorted = top.sort((a, b) => b.total - a.total);
  } else {
    sorted = [...top, otherTotal].sort((a, b) => b.total - a.total);
  }

  return sorted.map(({ category, data_eth, data_gno, data_arb }) => ({ category, data_eth, data_gno, data_arb }));
}

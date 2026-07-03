import { Dispute } from '../graphql/subgraph';
import { LItem } from '../graphql/subgraph';
import { getArbitrableCategory, UNKNOWN_CATEGORY } from './arbitrableCategories';
import { findArbitrableName } from './helpers';
import type { FeeByDispute } from '../hooks/useFeesPaidByDispute';

interface ClusteredCategory {
  key: string;
  value: number;
  percentage: number;
}

interface CategoryData {
  category: string;
  data_eth: number;
  data_gno: number;
  data_arb: number;
}

const chainKeys: ('data_eth' | 'data_gno' | 'data_arb')[] = ['data_eth', 'data_gno', 'data_arb'];

/**
 * Cluster disputes by category for a single chain.
 * Returns [{ key: category, value: count, percentage }] sorted by count descending.
 */
export function clusterByCategory(disputes: Dispute[], categoryMap: Map<string, string>): ClusteredCategory[] {
  const occurrences: Record<string, number> = {};
  for (const dispute of disputes) {
    const category = categoryMap.get(dispute.id) ?? UNKNOWN_CATEGORY;
    occurrences[category] = (occurrences[category] ?? 0) + 1;
  }
  const total = disputes.length;
  return Object.entries(occurrences)
    .map(([key, value]) => ({ key, value, percentage: total ? value / total : 0 }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Build a disputeId → category Map for v1 chains (Mainnet, Gnosis).
 * Uses the Curate Address Tags registry for names, then maps names to
 * categories via the NAME_CATEGORY_MAP / ADDRESS_CATEGORY_MAP.
 */
export function getDisputeCategoriesV1(
  disputes: Dispute[],
  chainId: string,
  arbitrableNames: LItem[] | undefined,
): Map<string, string> {
  const result = new Map<string, string>();
  for (const dispute of disputes) {
    const address = dispute.arbitrable.id;
    const name = arbitrableNames ? findArbitrableName(address, chainId, arbitrableNames) : undefined;
    result.set(dispute.id, getArbitrableCategory(address, name));
  }
  return result;
}

export { UNKNOWN_CATEGORY };

/**
 * Aggregate fees (ETH) by category across chains.
 * Returns [{ category, data_eth, data_gno, data_arb }] sorted by total fees
 * descending.
 *
 * If `topN` is provided, only the top N categories are returned and the rest
 * are grouped under `otherCategory` (defaults to "Other").
 */
export function aggregateFeesByCategory(
  feesByChain: FeeByDispute[][],
  categoriesByChain: Map<string, string>[],
  topN?: number,
  otherCategory = 'Other',
): CategoryData[] {
  const totals: Record<string, { data_eth: number; data_gno: number; data_arb: number; total: number }> = {};

  feesByChain.forEach((fees, index) => {
    const key = chainKeys[index];
    const categoryMap = categoriesByChain[index];
    if (!categoryMap) return;

    for (const fee of fees) {
      const category = categoryMap.get(fee.disputeId) ?? UNKNOWN_CATEGORY;
      if (!totals[category]) {
        totals[category] = { data_eth: 0, data_gno: 0, data_arb: 0, total: 0 };
      }
      totals[category][key] += fee.usdAmount;
      totals[category].total += fee.usdAmount;
    }
  });

  let sorted = Object.entries(totals)
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

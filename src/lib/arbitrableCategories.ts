/**
 * Arbitrable category mapper for v1 chains (Mainnet, Gnosis).
 *
 * v2 (Arbitrum) gets categories directly from the DRT subgraph
 * (DisputeTemplateDataV2.category). v1 has no such field, so we derive
 * categories from the arbitrable name (fetched via Curate Address Tags).
 *
 * To add a new mapping, just add an entry to NAME_CATEGORY_MAP or
 * ADDRESS_CATEGORY_MAP below.
 *
 * NAME_CATEGORY_MAP: matched case-insensitively against the Curate name
 *   using substring match (e.g. "proof of humanity" matches
 *   "Proof of Humanity v2").
 *
 * ADDRESS_CATEGORY_MAP: exact match (case-insensitive) on the address.
 *   Use this for arbitrables that have no Curate tag or whose name
 *   doesn't match any NAME_CATEGORY_MAP entry.
 */

export const UNKNOWN_CATEGORY = 'Unknown';

// Substring match against Curate name (case-insensitive).
// Order matters: first match wins, so put more specific entries first.
const NAME_CATEGORY_MAP: { match: string; category: string }[] = [
  { match: 'proof of humanity', category: 'Proof of Humanity' },
  { match: 'curate', category: 'Curation' },
  { match: 'address tag', category: 'Curation' },
  { match: 'domain name', category: 'Curation' },
  { match: 'kleros tokens', category: 'Curation' },
  { match: 'omen', category: 'Prediction Markets' },
  { match: 'reality', category: 'Prediction Markets' },
  { match: 'prediction', category: 'Prediction Markets' },
  { match: 'cleancoin', category: 'Finance' },
  { match: 'unslingshot', category: 'Finance' },
  // Add more entries here
];

// Exact address match (case-insensitive). Use for untagged arbitrables
// or to override the name-based mapping.
const ADDRESS_CATEGORY_MAP: Record<string, string> = {
  // '0x916deab80dfbc7030277047cd18b233b3ce5b4ab': 'Some Category',
  // Add more entries here
};

/**
 * Resolve the category for a v1 arbitrable.
 * @param address - The arbitrable contract address
 * @param name - The Curate name (if available)
 * @returns The category string, or UNKNOWN_CATEGORY if no match
 */
export function getArbitrableCategory(address: string, name?: string): string {
  // Address match takes priority (explicit override)
  const addrLower = address.toLowerCase();
  if (ADDRESS_CATEGORY_MAP[addrLower]) {
    return ADDRESS_CATEGORY_MAP[addrLower];
  }

  // Name substring match
  if (name) {
    const nameLower = name.toLowerCase();
    for (const entry of NAME_CATEGORY_MAP) {
      if (nameLower.includes(entry.match)) {
        return entry.category;
      }
    }
  }

  return UNKNOWN_CATEGORY;
}

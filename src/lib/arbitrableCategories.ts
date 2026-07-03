/**
 * Arbitrable category mapper for v1 chains (Mainnet, Gnosis).
 *
 * v2 (Arbitrum) gets categories directly from the DRT subgraph
 * (DisputeTemplateDataV2.category). v1 has no such field, so we derive
 * categories from the arbitrable address (ADDRESS_CATEGORY_MAP) or,
 * as fallback, from the Curate name (NAME_CATEGORY_MAP).
 *
 * Workflow:
 *   1. Edit arbitrables.csv (scripts/generate-arbitrables-csv.mjs generates it).
 *   2. Run `node scripts/sync-csv-to-address-map.mjs` to regenerate ADDRESS_CATEGORY_MAP.
 *   3. Commit this file.
 *
 * NAME_CATEGORY_MAP: matched case-insensitively against the Curate name.
 *   Only contains patterns that appear in Curate Address Tags — NOT Etherscan
 *   contract names (those are not available at runtime).
 *
 * ADDRESS_CATEGORY_MAP: source of truth. Generated from arbitrables.csv.
 *   Address match takes priority over name match.
 */

export const UNKNOWN_CATEGORY = 'Unknown';

// Substring match against Curate name (case-insensitive).
// Only add patterns that actually appear in Curate Address Tags registry.
const NAME_CATEGORY_MAP: { match: string; category: string }[] = [
  { match: 'proof of humanity', category: 'Proof of Humanity' },
  { match: 'curate', category: 'Curation' },
  { match: 'address tag', category: 'Curation' },
  { match: 'domain name', category: 'Curation' },
  { match: 'kleros tokens', category: 'Curation' },
  { match: 'linguo', category: 'Linguo' },
  { match: 'omen', category: 'Prediction Markets' },
  { match: 'reality', category: 'Prediction Markets' },
  { match: 'prediction', category: 'Prediction Markets' },
  { match: 'cleancoin', category: 'Finance' },
  { match: 'unslingshot', category: 'Finance' },
  // Add patterns here ONLY if they appear in Curate Address Tags names
];

// Source of truth — generated from arbitrables.csv.
// Address match takes priority over name match.
// To update: edit arbitrables.csv, then run scripts/sync-csv-to-address-map.mjs.
const ADDRESS_CATEGORY_MAP: Record<string, string> = {
  // --- Curation ---
  '0x76944a2678a0954a610096ee78e8ceb8d46d5922': 'Curation', // Address Tags Registry v1.0 (Deprecated)
  '0x66260c69d03837016d88c9877e61e08ef74c59f2': 'Curation', // Address Tags Registry v2.0
  '0x957a53a994860be4750810131d9c876b2f52d6e1': 'Curation', // Contract Domain Name Registry v2.0
  '0xee1502e29795ef6c2d60f8d7120596abe3bad990': 'Curation', // Kleros Tokens Registry v2.1
  '0x916deab80dfbc7030277047cd18b233b3ce5b4ab': 'Curation', // ArbitrableAddressList
  '0xcb4aae35333193232421e86cd2e9b6c91f3b125f': 'Curation', // ArbitrableAddressList
  '0xe0cf18e8630545aa553f88079c75dae56b8fb304': 'Curation', // ArbitrableAddressList
  '0xebcf3bca271b26ae4b162ba560e243055af0e679': 'Curation', // ArbitrableTokenList
  '0x1e9c3b5f57974beadbd8c28ba918d85b8477c618': 'Curation', // GeneralizedTCR
  '0x250aa88c8f54f5e70b94214380342f0d53e42f6c': 'Curation', // GeneralizedTCR
  '0x2e3b10abf091cdc53cc892a50dabdb432e220398': 'Curation', // GeneralizedTCR
  '0x6f15ca438992d9a4d7281e7e80381c4d904b2a24': 'Curation', // GeneralizedTCR
  '0x7884a7adf697e18357087fe8f994669042af4ae9': 'Curation', // GeneralizedTCR
  '0x7f112a0dc0ac7be95ac3c58532485f60726bb42c': 'Curation', // GeneralizedTCR
  '0x941b4a0dfdc7f15275a4cb6913b395647bb69fc3': 'Curation', // GeneralizedTCR
  '0x99a0f0e0d9ee776d791d2e55c215d05ccf7286fc': 'Curation', // GeneralizedTCR
  '0xb72103ee8819f2480c25d306eeab7c3382fba612': 'Curation', // GeneralizedTCR
  '0xf339047c85d0dd2645f2bd802a1e8a5e7af61053': 'Curation', // GeneralizedTCR
  '0x479083b5343ab89bb39608e3176d750c8a6957b5': 'Curation', // LightGeneralizedTCR
  '0x4a9f8e73b3c4c9d7fa0210b9de457b1c493a3ada': 'Curation', // LightGeneralizedTCR
  '0x6e31d83b0c696f7d57241d3dffd0f2b628d14c67': 'Curation', // LightGeneralizedTCR
  '0x7ecffaa0247227a29d613adb3b1b47e44f0f53cb': 'Curation', // LightGeneralizedTCR
  '0xda03509bb770061a61615ad8fc8e1858520ebd86': 'Curation', // LightGeneralizedTCR
  '0x01f292c270f1d477019e9b16465a7c411a160ca9': 'Curation', // LightGeneralizedTCR
  '0x2f19f817bbf800b487b7f2e51f24ad5ea0222463': 'Curation', // LightGeneralizedTCR
  '0x43adac2fa0fdf58ca585b0e0f4c9914a06ea80e0': 'Curation', // LightGeneralizedTCR
  '0x5aaf9e23a11440f8c1ad6d2e2e5109c7e52cc672': 'Curation', // LightGeneralizedTCR
  '0x70533554fe5c17caf77fe530f77eab933b92af60': 'Curation', // LightGeneralizedTCR
  '0x88b507b7e36f8d19e11dfa4f958dba8d6cebdc17': 'Curation', // LightGeneralizedTCR
  '0x9fe4d9e4989ad031fdc424d8c34d77e70aa0b269': 'Curation', // LightGeneralizedTCR
  '0xa78ec5742a5d360f92f6d6d7e775fb35ab559a51': 'Curation', // LightGeneralizedTCR
  '0xae6aaed5434244be3699c56e7ebc828194f26dc3': 'Curation', // LightGeneralizedTCR
  '0xd5994f15be9987104d9821aa99d1c97227c7c08c': 'Curation', // LightGeneralizedTCR
  '0x7305c57b731876f452da8574a77d05957820e588': 'Curation', // PermanentGTCR
  '0xc411f39cb23486eda70a180b48040ca246cb232c': 'Curation', // PermanentGTCR
  '0xdae29e2b80f4810f07abfd6acd8eec4507d286ea': 'Curation', // PermanentGTCR
  '0x4b89e798b10478a839ea0abcf86c4b94a3c782a4': 'Curation', // ArbitrableProxy — Chats Content Moderation
  '0x2b6869e4f1d6104989f15da7454dbf7a01310bb8': 'Curation', // self-insurance claims list (MetaEvidence)

  // --- Proof of Humanity ---
  '0xc5e9ddebb09cd64dfacab4011a0d5cedaf7c9bdb': 'Proof of Humanity', // Proof of Humanity
  '0xbe9834097a4e97689d9b667441acafb456d0480a': 'Proof of Humanity', // TransparentUpgradeableProxy — PoH V2
  '0xa4ac94c4fa65bb352efa30e3408e64f72ac857bc': 'Proof of Humanity', // TransparentUpgradeableProxy — PoH V2

  // --- Prediction Markets ---
  '0x54a92c21c6553a8085066311f2c8d9db1b5e6610': 'Prediction Markets', // Pythia tweets (MetaEvidence)
  '0x86e72802d9abbf7505a889721fd4d6947b02320e': 'Prediction Markets', // Sports Questions Sets (MetaEvidence)
  '0x2018038203aee8e7a29dabd73771b0355d4f85ad': 'Prediction Markets', // Realitio_v2_1_ArbitratorWithAppeals
  '0x728cba71a3723caab33ea416cb46e2cc9215a596': 'Prediction Markets', // Realitio_v2_1_ArbitratorWithAppeals
  '0xf72cfd1b34a91a64f9a98537fe63fbab7530adca': 'Prediction Markets', // Realitio_v2_1_ArbitratorWithAppeals
  '0x2a2bab2c2d4eb5007b0389720b287d4d19dc4001': 'Prediction Markets', // Realitio_v2_1_ArbitratorWithAppeals
  '0x2e39b8f43d0870ba896f516f78f57cde773cf805': 'Prediction Markets', // Realitio_v2_1_ArbitratorWithAppeals
  '0x54068a67441a950ff33afa5a3247acc7188d0789': 'Prediction Markets', // Realitio_v2_1_ArbitratorWithAppeals
  '0xe04f5791d671d5c4e08ab49b39807087b591ea3e': 'Prediction Markets', // Realitio_v2_1_ArbitratorWithAppeals
  '0x126697b552b83f08c7ebebae8d13eae2871e4e1e': 'Prediction Markets', // RealitioArbitratorProxy
  '0x594ec762b59978c97c82bc36ab493ed8b1f1f368': 'Prediction Markets', // RealitioArbitratorProxy
  '0x701cabaf65ed3974925fb94988842a29d2ce7aa3': 'Prediction Markets', // RealitioArbitratorProxy
  '0xd47f72a2d1d0e91b0ec5e5f5d02b2dc26d00a14d': 'Prediction Markets', // RealitioArbitratorProxy
  '0xd7e143715a4244634d74201959372e81a3623a2a': 'Prediction Markets', // RealitioArbitratorProxy
  '0x2f0895732bfacdcf2fdb19962fe609d0da695f21': 'Prediction Markets', // RealitioForeignArbitrationProxyWithAppeals
  '0x32bcdc9776692679cfbbf8350bad67da13faaa3f': 'Prediction Markets', // RealitioForeignArbitrationProxyWithAppeals
  '0x4a7e264b67852ea8b737e505739cb557c7c43c00': 'Prediction Markets', // RealitioForeignArbitrationProxyWithAppeals
  '0x6341ec8f3f23689bd6ea3cf82fe34c3a0481c30a': 'Prediction Markets', // RealitioForeignArbitrationProxyWithAppeals
  '0x68c4cc21378301cfdd5702d66d58a036d7bafe28': 'Prediction Markets', // RealitioForeignArbitrationProxyWithAppeals
  '0x776e5853e3d61b2dfb22bcf872a43bf9a1231e52': 'Prediction Markets', // RealitioForeignArbitrationProxyWithAppeals
  '0xef2ae6961ec7f2105bc2693bc32fa7b7386b2f59': 'Prediction Markets', // RealitioForeignArbitrationProxyWithAppeals
  '0xfe0eb5fc686f929eb26d541d75bb59f816c0aa68': 'Prediction Markets', // RealitioForeignArbitrationProxyWithAppeals
  '0x3fb8314c628e9afe7677946d3e23443ce748ac17': 'Prediction Markets', // RealitioForeignProxyOptimism
  '0xf0b37feda6cdf5f78b37e1fbccc24969059f2044': 'Prediction Markets', // RealitioForeignProxyOptimism
  '0x412c0617f357e640406ff0b4ee55f547c3692ba7': 'Prediction Markets', // RealitioForeignProxyPolygon
  '0xd6bf90e1daaa5cdec82235d2db1b93a9d50c6046': 'Prediction Markets', // RealitioForeignProxyPolygon
  '0x135c573503f70dc290b1d60fe2e7f7eb114febd6': 'Prediction Markets', // BinaryArbitrableProxy — campaign/facts
  '0x799cb978dea5d6ca00ccb1794d3c3d4c89e40cd1': 'Prediction Markets', // BinaryArbitrableProxy — Real or Fake News
  '0xc9a3cd210cc9c11982c3acf7b7bf9b1083242cb6': 'Prediction Markets', // BinaryArbitrableProxy — True or False
  '0xd8bf5114796ed28aa52cff61e1b9ef4ec1f69a54': 'Prediction Markets', // BinaryArbitrableProxy — Real or Fake News

  // --- Governance ---
  '0x327a29fce0a6490e4236240be176daa282eccfdf': 'Governance', // KlerosGovernor
  '0xe5bcea6f87aaee4a81f64dfdb4d30d400e0e5cf4': 'Governance', // KlerosGovernor
  '0xf7de5537ecd69a94695fcf4bcdbdee6329b63322': 'Governance', // KlerosGovernor

  // --- Linguo ---
  '0x44863f5b7aab7cee181c0d84e244540125ef7af7': 'Linguo',
  '0xa3e4348bddc32afcedc5e088e0e21fd6154a0180': 'Linguo',
  '0xab0d90943a58b1a64c0171ee8e743d9998be6ac3': 'Linguo',
  '0xd8f8019c025c2ba6745543d9a3c338de1b98c103': 'Linguo',
  '0x0b928165a67df8254412483ae8c3b8cc7f2b4d36': 'Linguo',
  '0x1d48a279966f37385b4ab963530c6dc813b3a8df': 'Linguo',
  '0x464c84c41f3c25ba5a75b006d8b20600a8777306': 'Linguo',
  '0xa2bfff0553de7405781fe0c39c04a383f04b9c80': 'Linguo',

  // --- Escrow ---
  '0xc25a0b9681abf6f090aed71a8c08fb564b41dab6': 'Escrow', // MultipleArbitrableTokenTransaction
  '0x0d67440946949fe293b45c52efd8a9b3d51e2522': 'Escrow', // MultipleArbitrableTransaction
  '0x46580533db92c418a79f91b46df70283daef7f99': 'Escrow', // MultipleArbitrableTransaction

  // --- Finance ---
  '0xe0e1bc8c6cd1b81993e2fcfb80832d814886ea38': 'Finance', // TransparentUpgradeableProxy — Unslashed

  // --- Other ---
  '0xc7e49251807780dfbbca72778890b80bd946590b': 'Other', // test: Example Dispute / Trolley Problem
  '0x1128ed55ab2d796fa92d2f8e1f336d745354a77a': 'Other', // test: Testing DR on xDai
  '0xc7add3c961f7935cb4914e37da991d2f1cd7986c': 'Other', // social/test disputes
  '0x99489d7bb33539f3d1a401741e56e8f02b9ae0cf': 'Other', // ArbitrableProxy — The Assassination Plot (test)
  '0xf65c7560d6ce320cc3a16a07f1f65aab66396b9e': 'Other', // BinaryArbitrableProxy — mixed (Writing + Fake News)
  '0x62b286a93d6f720a654745a3451f71cf71481b81': 'Other', // FeatureERC20
  '0xce9260c08272fa39c9af1307cd079dc5636bee01': 'Other', // FeatureERC20
  '0xaeecfa44639b61d2e0a9534d918789d94a24a9de': 'Other', // Yubiai
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
  if (ADDRESS_CATEGORY_MAP[addrLower] !== undefined) {
    return ADDRESS_CATEGORY_MAP[addrLower];
  }

  // Curate name substring match (fallback for new/unknown arbitrables)
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

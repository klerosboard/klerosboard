import { apolloClientQuery } from './apolloClient';
import { Evidence } from './types';

/**
 * Display subgraph endpoints (same ones used by court.kleros.io).
 * These subgraphs index evidence events and expose them via GraphQL,
 * avoiding the need for eth_getLogs entirely.
 */
const DISPLAY_SUBGRAPH: Record<string, string> = {
  '1': 'https://api.studio.thegraph.com/query/61738/kleros-display-mainnet/version/latest',
  '100': 'https://api.studio.thegraph.com/query/61738/kleros-display-gnosis/version/latest',
};

const EVIDENCE_V2_QUERY = `
  query getEvidenceV2($id: ID!) {
    evidenceGroup(id: $id) {
      evidences {
        id
        name
        description
        fileURI
        fileTypeExtension
        senderAddress
        timestamp
      }
    }
  }
`;

interface EvidenceV2Item {
  id: string;
  name?: string;
  description?: string;
  fileURI?: string;
  fileTypeExtension?: string;
  senderAddress: string;
  timestamp: string;
}

/**
 * Kleros v2 (Arbitrum): evidence is indexed directly in the coreneo subgraph.
 * evidenceGroup(id: disputeId) already has name/description/fileURI parsed — no IPFS fetch needed.
 */
async function fetchEvidenceV2(disputeId: string): Promise<Evidence[]> {
  const response = await apolloClientQuery<{ evidenceGroup: { evidences: EvidenceV2Item[] } | null }>(
    '42161',
    EVIDENCE_V2_QUERY,
    { id: disputeId },
  );

  const items = response?.data?.evidenceGroup?.evidences ?? [];

  return items.map((item) => ({
    evidenceJSON: {
      title: item.name ?? '',
      description: item.description ?? '',
      fileURI: item.fileURI ?? '',
      fileHash: '',
    },
    evidenceValid: true,
    fileValid: true,
    submittedBy: item.senderAddress,
    submittedAt: item.timestamp,
  }));
}

/**
 * Fetch evidence for a dispute via the Kleros display subgraph.
 *
 * This replaces the old eth_getLogs approach which was blocked by
 * restrictive RPC limits (10-25 blocks max on free tiers).
 *
 * The display subgraph is the same one used by court.kleros.io and:
 * - Already filters evidence by evidenceGroupID
 * - Is publicly accessible (no API key needed)
 * - Provides URI, sender, and creationTime for each evidence item
 *
 * @param chainId - Chain ID ("1" for mainnet, "100" for gnosis)
 * @param disputeId - The dispute ID to fetch evidence for
 */
export async function fetchEvidenceByDispute(chainId: string, disputeId: string): Promise<Evidence[]> {
  if (chainId === '42161') return fetchEvidenceV2(disputeId);

  const subgraphUrl = DISPLAY_SUBGRAPH[chainId];
  if (!subgraphUrl) return [];

  try {
    // 1. Query the display subgraph for evidence items
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query getEvidence($id: String!) {
            dispute(id: $id) {
              evidenceGroup {
                evidence {
                  URI
                  sender
                  creationTime
                }
              }
            }
          }
        `,
        variables: { id: disputeId },
      }),
    });

    if (!response.ok) {
      throw new Error(`Display subgraph returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const evidenceData = result?.data?.dispute?.evidenceGroup?.evidence ?? [];

    // 2. Fetch evidence JSON from IPFS for each item
    const evidencePromises = evidenceData.map(async (item: { URI: string; sender: string; creationTime: string }) => {
      try {
        const evidenceJSON = await fetchEvidenceJSON(item.URI);

        if (evidenceJSON) {
          return {
            evidenceJSON,
            evidenceValid: true,
            fileValid: true,
            submittedBy: item.sender,
            submittedAt: item.creationTime,
          };
        }

        // URI was valid but JSON fetch failed — return error state
        return {
          evidenceJSON: {} as Evidence['evidenceJSON'],
          evidenceValid: false,
          fileValid: false,
          submittedBy: item.sender,
          submittedAt: item.creationTime,
        };
      } catch {
        return null;
      }
    });

    const evidence = (await Promise.all(evidencePromises)).filter((e): e is Evidence => e !== null);

    return evidence;
  } catch (error) {
    throw new Error(`Error fetching evidence: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetch and parse evidence JSON from an IPFS URI.
 */
async function fetchEvidenceJSON(uri: string): Promise<Evidence['evidenceJSON'] | null> {
  // Skip if URI is an empty/invalid address
  if (!uri || uri === '0x0000000000000000000000000000000000000000') {
    return null;
  }

  try {
    const ipfsUrl = uri.startsWith('/ipfs/') ? `https://cdn.kleros.link${uri}` : uri;

    const response = await fetch(ipfsUrl);
    if (!response.ok) return null;

    const data = await response.json();

    // Normalize: some PoH cases use `evidence` field instead of `fileURI`
    if (data && typeof data === 'object' && !data.fileURI && data.evidence) {
      data.fileURI = data.evidence;
    }

    return data;
  } catch {
    return null;
  }
}

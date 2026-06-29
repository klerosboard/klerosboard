import executeDynamicScript, { SandboxConfig } from './dynamicScriptSandbox';
import { arbitrableWhitelist, getRPCURL, GNOSIS_KLEROSLIQUID, MAINNET_KLEROSLIQUID } from './helpers';
import { MetaEvidence, MetaEvidenceJson } from './types';

/**
 * Phase 1 result: base metaEvidence fetched from API + IPFS.
 * Does NOT include dynamic script results yet.
 */
export interface BaseMetaEvidence {
  metaEvidenceJSON: MetaEvidenceJson;
  sandboxConfig: SandboxConfig;
  scriptParameters: Record<string, string> | null;
  dynamicScriptUrl: string | null;
}

/**
 * Phase 1: Fetch metaEvidence JSON from Kleros API + IPFS.
 * Fast (~1-2s). Does not execute any dynamic script.
 * Throws on failure so TanStack Query can retry.
 */
export async function fetchBaseMetaEvidence({
  chainId,
  arbitrableId,
  disputeId,
}: {
  chainId: string;
  arbitrableId: string;
  disputeId: string;
}): Promise<BaseMetaEvidence> {
  const chainIdNum = parseInt(chainId, 10);
  const isWhitelisted = arbitrableWhitelist[chainIdNum]?.includes(arbitrableId.toLowerCase()) ?? false;

  const sandboxConfig: SandboxConfig = {
    sandboxAttributes: isWhitelisted ? ['allow-same-origin', 'allow-scripts'] : ['allow-scripts'],
    rpcUrl: getRPCURL(chainId),
  };

  // Step 1: Get metaEvidence URI from Kleros API
  const apiUrl = new URL(import.meta.env.VITE_KLEROS_API_URL);
  apiUrl.searchParams.set('chainId', chainId);
  apiUrl.searchParams.set('disputeId', disputeId);

  const apiResponse = await fetch(apiUrl.toString());
  if (!apiResponse.ok) {
    throw new Error(`API error: ${apiResponse.status}`);
  }

  const apiData = await apiResponse.json();
  const metaEvidenceUri = apiData.metaEvidenceUri;

  if (!metaEvidenceUri) {
    throw new Error('No metaEvidenceUri in API response');
  }

  // Step 2: Fetch metaEvidence JSON from IPFS
  const metaEvidenceUrl = `https://cdn.kleros.link${metaEvidenceUri}`;
  let metaEvidenceResponse = await fetch(metaEvidenceUrl);
  if (!metaEvidenceResponse.ok && metaEvidenceUri.endsWith('.')) {
    const fallbackUrl = `https://cdn.kleros.link${metaEvidenceUri}json`;
    metaEvidenceResponse = await fetch(fallbackUrl);
  }
  if (!metaEvidenceResponse.ok) {
    throw new Error(`Failed to fetch metaEvidence JSON: ${metaEvidenceResponse.status}`);
  }

  const metaEvidenceJSON: MetaEvidenceJson = await metaEvidenceResponse.json();

  // Step 3: Prepare dynamic script params if present (but don't execute yet)
  let scriptParameters: Record<string, string> | null = null;
  let dynamicScriptUrl: string | null = null;

  if (metaEvidenceJSON.dynamicScriptURI) {
    const KL = chainId === '100' ? GNOSIS_KLEROSLIQUID : MAINNET_KLEROSLIQUID;
    const arbitratorChainID = metaEvidenceJSON.arbitratorChainID ?? chainId;
    const arbitrableChainID = metaEvidenceJSON.arbitrableChainID ?? arbitratorChainID;

    scriptParameters = {
      disputeID: disputeId,
      arbitrableContractAddress: arbitrableId,
      arbitratorContractAddress: KL,
      arbitratorChainID,
      arbitrableChainID,
      arbitratorJsonRpcUrl: getRPCURL(arbitratorChainID),
      arbitrableJsonRpcUrl: getRPCURL(arbitrableChainID),
    };

    dynamicScriptUrl = `https://cdn.kleros.link${metaEvidenceJSON.dynamicScriptURI}`;
  }

  return { metaEvidenceJSON, sandboxConfig, scriptParameters, dynamicScriptUrl };
}

/**
 * Phase 2: Execute the dynamic script in the sandbox.
 * Can take minutes for cross-chain Reality.eth scripts (~800+ RPC calls).
 * No timeout — runs until completion or error.
 * Returns the merged metaEvidenceJSON with rulingOptions.titles populated.
 */
export async function fetchDynamicScriptResult(base: BaseMetaEvidence): Promise<MetaEvidenceJson> {
  const { metaEvidenceJSON, sandboxConfig, scriptParameters, dynamicScriptUrl } = base;

  if (!dynamicScriptUrl || !scriptParameters) {
    return metaEvidenceJSON;
  }

  const scriptResponse = await fetch(dynamicScriptUrl);
  if (!scriptResponse.ok) {
    throw new Error(`Failed to fetch dynamic script: ${scriptResponse.status}`);
  }
  const scriptText = await scriptResponse.text();

  const scriptSandboxConfig: SandboxConfig = {
    ...sandboxConfig,
    rpcUrl: getRPCURL(scriptParameters.arbitrableChainID),
  };

  const scriptResult = await executeDynamicScript(scriptText, scriptParameters, scriptSandboxConfig);

  if (scriptResult && typeof scriptResult === 'object') {
    return { ...metaEvidenceJSON, ...scriptResult };
  }
  return metaEvidenceJSON;
}

/**
 * Assemble a MetaEvidence from a base fetch + optional dynamic result.
 */
export function assembleMetaEvidence(metaEvidenceJSON: MetaEvidenceJson, interfaceValid: boolean): MetaEvidence {
  return {
    metaEvidenceValid: true,
    fileValid: true,
    interfaceValid,
    metaEvidenceJSON,
    submittedAt: Date.now(),
    blockNumber: 0,
    transactionHash: '',
  };
}

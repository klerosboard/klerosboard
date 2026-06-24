import executeDynamicScript, { SandboxConfig } from './dynamicScriptSandbox';
import {
  arbitrableWhitelist,
  getRPCURL,
  GNOSIS_KLEROSLIQUID,
  MAINNET_KLEROSLIQUID,
} from './helpers';
import { MetaEvidence, MetaEvidenceJson } from './types';

/**
 * Fallback MetaEvidence returned when dynamic script execution fails after 120s retry loop.
 */
const FALLBACK_META_EVIDENCE: MetaEvidenceJson = {
  fileURI: '',
  fileHash: '',
  fileTypeExtension: '',
  category: '',
  title: 'Invalid or tampered case data, refuse to arbitrate.',
  description:
    'The data for this case is not formatted correctly or has been tampered since the time of its submission. Please refresh the page and refuse to arbitrate if the problem persists.',
  aliases: {},
  question: '',
  rulingOptions: {
    type: 'single-select',
    precision: 0,
    titles: [],
    descriptions: [],
  },
  dynamicScriptURI: '',
  dynamicScriptHash: '',
};

/**
 * Fetch metaEvidence for a dispute via Kleros public API + IPFS + dynamic script sandbox.
 * Implements 120s retry loop for the entire fetch + script execution pipeline.
 *
 * Steps:
 * 1. Resolve sandbox configuration based on whitelist
 * 2. Retry loop (120s, 5s intervals):
 *    a. Call Kleros API to get metaEvidence IPFS URI
 *    b. Fetch metaEvidence JSON from IPFS gateway
 *    c. If dynamicScriptURI exists, fetch script and execute in sandbox (with RPC redirect)
 *    d. Merge script result into metaEvidenceJSON
 * 3. On success: return typed MetaEvidence
 * 4. On timeout: return fallback MetaEvidence with interfaceValid=false
 */
export async function fetchMetaEvidence({
  chainId,
  arbitrableId,
  disputeId,
}: {
  chainId: string;
  arbitrableId: string;
  disputeId: string;
}): Promise<MetaEvidence> {
  // Resolve sandbox configuration based on arbitrable whitelist
  const chainIdNum = parseInt(chainId, 10);
  const isWhitelisted =
    arbitrableWhitelist[chainIdNum]?.includes(arbitrableId.toLowerCase()) ??
    false;

  const sandboxConfig: SandboxConfig = {
    sandboxAttributes: isWhitelisted
      ? ['allow-same-origin', 'allow-scripts']
      : ['allow-scripts'],
    rpcUrl: getRPCURL(chainId),
  };

  const maxRetryTime = 120000; // 120 seconds
  const retryInterval = 5000; // 5 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxRetryTime) {
    try {
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
      const metaEvidenceResponse = await fetch(metaEvidenceUrl);
      if (!metaEvidenceResponse.ok) {
        throw new Error(
          `Failed to fetch metaEvidence JSON: ${metaEvidenceResponse.status}`,
        );
      }

      let metaEvidenceJSON: MetaEvidenceJson =
        await metaEvidenceResponse.json();
      let interfaceValid = true;

      // Step 3 & 4: Handle dynamic script if present
      if (metaEvidenceJSON.dynamicScriptURI) {
        try {
          const dynamicScriptUrl = `https://cdn.kleros.link${metaEvidenceJSON.dynamicScriptURI}`;
          const scriptResponse = await fetch(dynamicScriptUrl);
          if (!scriptResponse.ok) {
            throw new Error(
              `Failed to fetch dynamic script: ${scriptResponse.status}`,
            );
          }

          const scriptText = await scriptResponse.text();

          // Prepare script parameters
          const KL =
            chainId === '100' ? GNOSIS_KLEROSLIQUID : MAINNET_KLEROSLIQUID;
          const scriptParameters = {
            disputeID: disputeId,
            arbitrableContractAddress: arbitrableId,
            arbitratorContractAddress: KL,
            arbitratorChainID: chainId,
            arbitrableChainID: chainId,
            arbitratorJsonRpcUrl: getRPCURL(chainId),
            arbitrableJsonRpcUrl: getRPCURL(chainId),
          };

          // Execute script in sandbox with RPC redirect patch
          const scriptResult = await executeDynamicScript(
            scriptText,
            scriptParameters,
            sandboxConfig,
          );

          // Merge result into metaEvidenceJSON
          if (scriptResult && typeof scriptResult === 'object') {
            metaEvidenceJSON = {
              ...metaEvidenceJSON,
              ...scriptResult,
            };
          }
        } catch (scriptError) {
          // Log warning but don't fail — return base metaEvidence without dynamic result
          console.warn('Dynamic script execution failed:', scriptError);
          interfaceValid = false;
        }
      }

      // Step 5: Return typed MetaEvidence on success
      return {
        metaEvidenceValid: true,
        fileValid: true,
        interfaceValid,
        metaEvidenceJSON,
        submittedAt: Date.now(),
        blockNumber: 0,
        transactionHash: '',
      };
    } catch (error) {
      // Log the error and retry after delay
      console.warn(
        `Attempt to fetch metaEvidence failed (${Math.floor((Date.now() - startTime) / 1000)}s elapsed):`,
        error instanceof Error ? error.message : String(error),
      );

      // Check if we have time for another retry
      const timeElapsed = Date.now() - startTime;
      const timeRemaining = maxRetryTime - timeElapsed;

      if (timeRemaining <= 0) {
        // Timeout reached, return fallback
        console.error(
          `Failed to fetch metaEvidence after 120s retry loop. Returning fallback MetaEvidence.`,
        );
        return {
          metaEvidenceValid: true,
          fileValid: true,
          interfaceValid: false,
          metaEvidenceJSON: FALLBACK_META_EVIDENCE,
          submittedAt: Date.now(),
          blockNumber: 0,
          transactionHash: '',
        };
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryInterval));
    }
  }

  // Fallback (should not reach here, but just in case)
  return {
    metaEvidenceValid: true,
    fileValid: true,
    interfaceValid: false,
    metaEvidenceJSON: FALLBACK_META_EVIDENCE,
    submittedAt: Date.now(),
    blockNumber: 0,
    transactionHash: '',
  };
}

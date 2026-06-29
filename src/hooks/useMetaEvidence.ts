import { useQuery } from '@tanstack/react-query';
import { fetchBaseMetaEvidence, fetchDynamicScriptResult, assembleMetaEvidence } from '../lib/fetchMetaEvidence';
import { MetaEvidence } from '../lib/types';

export interface UseMetaEvidenceResult {
  /** Base metaEvidence (title, description, etc.) — available quickly. */
  metaEvidence: MetaEvidence | undefined;
  /** True while the dynamic script sandbox is still running. */
  isDynamicScriptLoading: boolean;
  error: string | undefined;
}

export const useMetaEvidence = (
  chainId: string = '1',
  arbitrableId: string | undefined,
  disputeId: string,
): UseMetaEvidenceResult => {
  const enabled = !!chainId && !!arbitrableId && !!disputeId;

  // Phase 1: fast — API + IPFS fetch only (~1-2s)
  const baseQuery = useQuery({
    queryKey: ['metaEvidenceBase', chainId, arbitrableId, disputeId],
    queryFn: () =>
      fetchBaseMetaEvidence({
        chainId,
        arbitrableId: arbitrableId!,
        disputeId,
      }),
    enabled,
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  // Phase 2: slow — dynamic script sandbox, no timeout, runs independently.
  // Only starts once Phase 1 has succeeded and there IS a dynamic script.
  const hasDynamicScript = !!baseQuery.data?.dynamicScriptUrl;

  const dynamicQuery = useQuery({
    queryKey: ['metaEvidenceDynamic', chainId, arbitrableId, disputeId],
    queryFn: () => fetchDynamicScriptResult(baseQuery.data!),
    enabled: enabled && !!baseQuery.data && hasDynamicScript,
    retry: 1,
    // Cache forever once resolved — re-running 800+ RPC calls on refocus is wasteful.
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Build the MetaEvidence to expose to consumers:
  // - While base is loading: undefined
  // - Base loaded, no dynamic script: assemble immediately with interfaceValid=true
  // - Base loaded, dynamic running: assemble from base JSON (titles will be missing/generic)
  // - Dynamic done: assemble from merged JSON
  let metaEvidence: MetaEvidence | undefined;
  const isDynamicScriptLoading = hasDynamicScript && !dynamicQuery.data && !dynamicQuery.isError;

  if (baseQuery.data) {
    const json = dynamicQuery.data ?? baseQuery.data.metaEvidenceJSON;
    const interfaceValid = !hasDynamicScript || !!dynamicQuery.data;
    metaEvidence = assembleMetaEvidence(json, interfaceValid);
  }

  const error = baseQuery.error?.message;

  return { metaEvidence, isDynamicScriptLoading, error };
};

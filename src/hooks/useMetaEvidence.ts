import { useQuery } from '@tanstack/react-query';
import { fetchBaseMetaEvidence, fetchDynamicScriptResult, assembleMetaEvidence } from '../lib/fetchMetaEvidence';
import { MetaEvidence } from '../lib/types';
import { useDisputeTemplateV2 } from './v2/useDisputeTemplateV2';

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
  templateId?: string | null,
): UseMetaEvidenceResult => {
  const isV2 = chainId === '42161';
  const enabled = !isV2 && !!chainId && !!arbitrableId && !!disputeId;

  // --- v2 path: fetch from DRT subgraph via templateId ---
  const { templateData, isLoading: isTemplateLoading } = useDisputeTemplateV2(isV2 ? templateId : null);

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

  // --- v2 early return: build MetaEvidence from DRT templateData ---
  if (isV2) {
    if (isTemplateLoading) {
      return { metaEvidence: undefined, isDynamicScriptLoading: false, error: undefined };
    }
    if (!templateData) {
      // No templateId or template not found — unblock render with a non-fatal error
      return {
        metaEvidence: undefined,
        isDynamicScriptLoading: false,
        error: templateId ? 'Template not found in DRT subgraph' : 'No templateId for this dispute',
      };
    }
    // Map DRT templateData to the MetaEvidence shape consumers expect
    const metaEvidenceV2: MetaEvidence = {
      metaEvidenceValid: true,
      fileValid: true,
      interfaceValid: true,
      submittedAt: 0,
      blockNumber: 0,
      transactionHash: '',
      metaEvidenceJSON: {
        title: templateData.title ?? '',
        description: templateData.description ?? '',
        question: templateData.question ?? '',
        category: templateData.category ?? '',
        fileURI: templateData.policyURI ?? '',
        fileHash: '',
        fileTypeExtension: '',
        aliases: {},
        rulingOptions: {
          type: 'single-select',
          precision: 0,
          titles: templateData.answers?.map((a) => a.title) as unknown as [],
          descriptions: templateData.answers?.map((a) => a.description) as unknown as [],
        },
        dynamicScriptURI: '',
        dynamicScriptHash: '',
      },
    };
    return { metaEvidence: metaEvidenceV2, isDynamicScriptLoading: false, error: undefined };
  }

  const error = baseQuery.error?.message;

  return { metaEvidence, isDynamicScriptLoading, error };
};

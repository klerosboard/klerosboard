import { useQuery } from '@tanstack/react-query';
import { fetchEvidenceByDispute } from '../lib/fetchEvidence';
import { Evidence } from '../lib/types';

export const useEvidence = (
  chainId: string = '1',
  disputeId: string,
): { evidences: Evidence[] | undefined; error: string | undefined } => {
  const { data, error } = useQuery<Evidence[], Error>({
    queryKey: ['evidence', chainId, disputeId],
    queryFn: () => fetchEvidenceByDispute(chainId, disputeId),
    enabled: !!chainId && !!disputeId,
  });

  return { evidences: data, error: error?.message };
};

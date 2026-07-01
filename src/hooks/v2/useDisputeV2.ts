import { DISPUTE_V2_QUERY } from '../../graphql/subgraphV2';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../../lib/apolloClient';
import { DisputeWithV2Meta, DisputeV2WithVotes, mapDisputeV2WithVotesToDispute } from './mappers/dispute';

export type { DisputeWithV2Meta } from './mappers/dispute';

export const useDisputeV2 = (chainId: string, disputeId: string, enabled = true) => {
  return useQuery<DisputeWithV2Meta, Error>({
    queryKey: ['useDisputeV2', chainId, disputeId],
    queryFn: async (): Promise<DisputeWithV2Meta> => {
      const response = await apolloClientQuery<{ dispute: DisputeV2WithVotes }>(chainId, DISPUTE_V2_QUERY, {
        id: disputeId,
      });

      if (!response || !response.data) throw new Error('No response from TheGraph');
      if (!response.data.dispute) throw new Error('Dispute not found');

      return mapDisputeV2WithVotesToDispute(response.data.dispute);
    },
    enabled: enabled && !!chainId && !!disputeId,
  });
};

import { DISPUTES_V2_QUERY, DisputeV2 } from '../../graphql/subgraphV2';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../../lib/apolloClient';
import { Dispute } from '../../graphql/subgraph';
import { mapDisputeV2ToDispute } from './mappers/dispute';

interface Props {
  chainId: string;
  subcourtID?: string;
  arbitrableID?: string;
  creator?: string;
  enabled?: boolean;
}

export const useDisputesV2 = ({ chainId, subcourtID, arbitrableID, creator, enabled = true }: Props) => {
  return useQuery<Dispute[], Error>({
    queryKey: ['useDisputesV2', chainId, subcourtID, arbitrableID, creator],
    queryFn: async (): Promise<Dispute[]> => {
      let disputes: Dispute[] = [];
      let lastId = '';

      // Paginate through all disputes using cursor-based pagination (id_gt)
      while (true) {
        const response = await apolloClientQuery<{ disputes: DisputeV2[] }>(chainId, DISPUTES_V2_QUERY, {
          first: 1000,
          skip: undefined,
          id_gt: lastId,
        });

        if (!response || !response.data) throw new Error('No response from TheGraph');

        const batch = (response.data.disputes || []).map(mapDisputeV2ToDispute);
        disputes = disputes.concat(batch);

        // Stop if this batch has fewer than 1000 results
        if (batch.length < 1000) {
          break;
        }

        // Move cursor to the last ID in this batch for the next iteration
        lastId = batch[batch.length - 1].id;
      }

      // Note: v2 schema does not support filtering by creator on the query level.
      // Apply client-side filters if provided (though this is less optimal than server-side).
      // For now, we skip filtering since v2 limits filtering options.
      if (subcourtID) {
        disputes = disputes.filter((d) => d.subcourtID.id === subcourtID);
      }
      if (arbitrableID) {
        disputes = disputes.filter((d) => d.arbitrable.id === arbitrableID.toLowerCase());
      }

      return disputes;
    },
    enabled: enabled && !!chainId,
  });
};

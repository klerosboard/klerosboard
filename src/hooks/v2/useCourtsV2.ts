import { COURTS_V2_QUERY, CourtV2 } from '../../graphql/subgraphV2';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../../lib/apolloClient';
import { Court } from '../../graphql/subgraph';
import { mapCourtV2ToCourt } from './mappers/court';

interface Props {
  chainId: string;
  subcourtID?: string;
  enabled?: boolean;
}

export const useCourtsV2 = ({ chainId, subcourtID, enabled = true }: Props) => {
  return useQuery<Court[], Error>({
    queryKey: ['useCourtsV2', chainId, subcourtID],
    enabled,
    queryFn: async (): Promise<Court[]> => {
      const response = await apolloClientQuery<{ courts: CourtV2[] }>(chainId, COURTS_V2_QUERY, {
        first: 1000,
        skip: 0,
      });

      if (!response || !response.data) throw new Error('No response from TheGraph');

      let courts = (response.data.courts || []).map(mapCourtV2ToCourt);

      // Filter by subcourtID if provided
      if (subcourtID) {
        courts = courts.filter((c) => c.id === subcourtID);
      }

      return courts;
    },
  });
};

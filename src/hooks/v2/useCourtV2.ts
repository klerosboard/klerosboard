import { COURT_V2_QUERY, CourtV2 } from '../../graphql/subgraphV2';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../../lib/apolloClient';
import { Court } from '../../graphql/subgraph';
import { mapCourtV2ToCourt } from './mappers/court';

export const useCourtV2 = (chainId: string, courtId: string, enabled = true) => {
  return useQuery<Court, Error>({
    queryKey: ['useCourtV2', chainId, courtId],
    queryFn: async (): Promise<Court> => {
      const response = await apolloClientQuery<{ court: CourtV2 }>(chainId, COURT_V2_QUERY, { id: courtId });

      if (!response || !response.data) throw new Error('No response from TheGraph');
      if (!response.data.court) throw new Error('Court not found');

      return mapCourtV2ToCourt(response.data.court);
    },
    enabled: enabled && !!chainId && !!courtId,
  });
};

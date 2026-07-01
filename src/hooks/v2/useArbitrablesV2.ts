import { ARBITRABLES_V2_QUERY, ArbitrableV2 } from '../../graphql/subgraphV2';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../../lib/apolloClient';
import { Arbitrable } from '../../graphql/subgraph';
import { mapArbitrableV2ToArbitrable } from './mappers/arbitrable';

interface Props {
  chainId: string;
  enabled?: boolean;
}

export const useArbitrablesV2 = ({ chainId, enabled = true }: Props) => {
  return useQuery<Arbitrable[], Error>({
    queryKey: ['useArbitrablesV2', chainId],
    enabled: enabled && !!chainId,
    queryFn: async (): Promise<Arbitrable[]> => {
      const response = await apolloClientQuery<{ arbitrables: ArbitrableV2[] }>(chainId, ARBITRABLES_V2_QUERY, {
        first: 1000,
        skip: 0,
      });

      if (!response || !response.data) throw new Error('No response from TheGraph');
      if (!response.data.arbitrables) {
        return [];
      }

      return response.data.arbitrables.map(mapArbitrableV2ToArbitrable);
    },
  });
};

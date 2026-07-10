import { ARBITRABLE_V2_QUERY } from '../../graphql/subgraphV2';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../../lib/apolloClient';
import { Arbitrable } from '../../graphql/subgraph';
import { mapArbitrableV2ToArbitrable } from './mappers/arbitrable';
import { ArbitrableV2 } from '../../graphql/subgraphV2';

interface Props {
  chainId: string;
  arbitrableId: string;
  enabled?: boolean;
}

export const useArbitrableV2 = ({ chainId, arbitrableId, enabled = true }: Props) => {
  return useQuery<Arbitrable, Error>({
    queryKey: ['useArbitrableV2', chainId, arbitrableId],
    enabled: enabled && !!chainId && !!arbitrableId,
    queryFn: async (): Promise<Arbitrable> => {
      const response = await apolloClientQuery<{ arbitrable: ArbitrableV2 }>(chainId, ARBITRABLE_V2_QUERY, {
        id: arbitrableId,
      });

      if (!response || !response.data) throw new Error('No response from TheGraph');
      if (!response.data.arbitrable) {
        throw new Error('Arbitrable not found');
      }

      return mapArbitrableV2ToArbitrable(response.data.arbitrable);
    },
  });
};

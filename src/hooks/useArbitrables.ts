import { Arbitrable, ARBITRABLE_FIELDS } from '../graphql/subgraph';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../lib/apolloClient';
import { useArbitrablesV2 } from './v2/useArbitrablesV2';

const query = `
    ${ARBITRABLE_FIELDS}
    query ArbitrablesQuery {
        arbitrables(first: 1000, orderBy: ethFees, orderDirection: desc) {
        ...ArbitrableFields
      }
    }
`;

function useArbitrablesV1(chainId: string, enabled = true) {
  return useQuery<Arbitrable[], Error>({
    queryKey: ['useArbitrablesV1', chainId],
    queryFn: async () => {
      const response = await apolloClientQuery<{ arbitrables: [Arbitrable] }>(chainId, query);
      if (!response || !response.data) throw new Error('No response from TheGraph');
      return response.data!.arbitrables;
    },
    enabled: enabled && !!chainId,
  });
}

export const useArbitrables = (chainId: string = '1') => {
  const isArbitrum = chainId === '42161';
  // Always call hooks — Rules of Hooks
  const v2Result = useArbitrablesV2({ chainId, enabled: isArbitrum });
  const v1Result = useArbitrablesV1(chainId, !isArbitrum);
  return isArbitrum ? v2Result : v1Result;
};

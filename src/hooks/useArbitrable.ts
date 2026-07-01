import { ARBITRABLE_FIELDS, Arbitrable } from '../graphql/subgraph';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../lib/apolloClient';
import { useArbitrableV2 } from './v2/useArbitrableV2';

const query = `
    ${ARBITRABLE_FIELDS}
    query ArbitrableQuery($arbitrableId: String) {
        arbitrable(id:$arbitrableId) {
        ...ArbitrableFields
      }
    }
`;

function useArbitrableV1(chainId: string, arbitrableId?: string, enabled = true) {
  return useQuery<Arbitrable, Error>({
    queryKey: ['useArbitrableV1', chainId, arbitrableId],
    queryFn: async () => {
      const response = await apolloClientQuery<{ arbitrable: Arbitrable }>(chainId, query, { arbitrableId });
      if (!response || !response.data) throw new Error('No response from TheGraph');
      return response.data!.arbitrable;
    },
    enabled: enabled && !!chainId && !!arbitrableId,
  });
}

export const useArbitrable = (chainId: string = '1', arbitrableId?: string) => {
  const isArbitrum = chainId === '42161';
  // Always call hooks — Rules of Hooks
  const v2Result = useArbitrableV2({
    chainId,
    arbitrableId: arbitrableId ?? '',
    enabled: isArbitrum && !!arbitrableId,
  });
  const v1Result = useArbitrableV1(chainId, isArbitrum ? undefined : arbitrableId);
  return isArbitrum ? v2Result : v1Result;
};

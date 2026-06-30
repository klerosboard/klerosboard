import { JUROR_FIELDS, Juror } from '../graphql/subgraph';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../lib/apolloClient';
import { useJurorsV2 } from './v2/useJurorsV2';

const query = `
    ${JUROR_FIELDS}
    query JurorsQuery {
      jurors(where: {totalStaked_gt: "0"}, first: 1000) {
        ...JurorFields
      }
    }
`;

/**
 * V1-only hook (Ethereum, Gnosis)
 */
export const useJurorsV1 = (chainId: string = '1') => {
  return useQuery<Juror[], Error>({
    queryKey: ['useJurorsV1', chainId],
    queryFn: async () => {
      const response = await apolloClientQuery<{ jurors: Juror[] }>(chainId, query);

      if (!response || !response.data) throw new Error('No response from TheGraph');

      return response.data!.jurors;
    },
    enabled: !!chainId,
  });
};

/**
 * Dispatcher hook: routes to v2 for Arbitrum, v1 for others
 */
export const useJurors = (chainId: string = '1') => {
  const isArbitrum = chainId === '42161';
  // Always call hooks — Rules of Hooks
  const v2Result = useJurorsV2({ chainId, enabled: isArbitrum });
  const v1Result = useJurorsV1(isArbitrum ? '' : chainId);
  return isArbitrum ? v2Result : v1Result;
};

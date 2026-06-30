import { JUROR_FIELDS, Juror } from '../graphql/subgraph';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../lib/apolloClient';
import { useProfileV2 } from './v2/useProfileV2';

const query = `
    ${JUROR_FIELDS}
    query JurorQuery($jurorID: String) {
        juror(id:$jurorID) {
        ...JurorFields
      }
    }
`;

function useProfileV1(chainId: string, profileID: string, enabled: boolean = true) {
  return useQuery<Juror, Error>({
    queryKey: ['useProfileV1', chainId, profileID],
    queryFn: async () => {
      const response = await apolloClientQuery<{ juror: Juror }>(chainId, query, { jurorID: profileID.toLowerCase() });

      if (!response || !response.data) throw new Error('No response from TheGraph');

      return response.data!.juror;
    },
    enabled: enabled && !!chainId,
  });
}

export const useProfile = (chainId: string = '1', profileID: string) => {
  const isArbitrum = chainId === '42161';
  // Always call hooks — Rules of Hooks
  const v2Result = useProfileV2({ chainId, profileID, enabled: isArbitrum });
  const v1Result = useProfileV1(chainId, profileID, !isArbitrum);
  return isArbitrum ? v2Result : v1Result;
};

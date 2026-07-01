import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../../lib/apolloClient';
import { Juror } from '../../graphql/subgraph';
import { UserV2, USERS_V2_QUERY } from '../../graphql/subgraphV2';
import { mapUserV2ToJurorList } from './mappers/juror';

interface UseJurorsV2Props {
  chainId?: string;
  enabled?: boolean;
}

export const useJurorsV2 = ({ chainId = '42161', enabled = true }: UseJurorsV2Props = {}) => {
  return useQuery<Juror[], Error>({
    queryKey: ['useJurorsV2', chainId],
    queryFn: async () => {
      const response = await apolloClientQuery<{ users: UserV2[] }>(chainId, USERS_V2_QUERY, { first: 1000, skip: 0 });

      if (!response || !response.data) throw new Error('No response from TheGraph');

      return response.data!.users.map(mapUserV2ToJurorList);
    },
    enabled: enabled && !!chainId,
  });
};

import { USER_V2_QUERY, UserV2 } from '../../graphql/subgraphV2';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../../lib/apolloClient';
import { Juror } from '../../graphql/subgraph';
import { mapUserV2ToJurorProfile } from './mappers/juror';

interface Props {
  chainId: string;
  profileID: string;
  enabled?: boolean;
}

export const useProfileV2 = ({ chainId, profileID, enabled = true }: Props) => {
  return useQuery<Juror, Error>({
    queryKey: ['useProfileV2', chainId, profileID],
    enabled: enabled && !!chainId && !!profileID,
    queryFn: async (): Promise<Juror> => {
      const response = await apolloClientQuery<{ user: UserV2 }>(chainId, USER_V2_QUERY, {
        id: profileID.toLowerCase(),
      });

      if (!response || !response.data) throw new Error('No response from TheGraph');
      if (!response.data.user) {
        throw new Error('User not found');
      }

      return mapUserV2ToJurorProfile(response.data.user);
    },
  });
};

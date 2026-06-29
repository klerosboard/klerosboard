import { USER_V2_QUERY, UserV2 } from '../../graphql/subgraphV2';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../../lib/apolloClient';
import { Juror } from '../../graphql/subgraph';

interface Props {
  chainId: string;
  profileID: string;
  enabled?: boolean;
}

/**
 * Maps v2 UserV2 to v1-compatible Juror shape.
 * v2 is missing: numberOfDisputesCreated, gas costs, rewards.
 * Components should gracefully handle undefined fields.
 */
function mapUserV2ToJuror(v2: UserV2): Juror {
  return {
    id: v2.id,
    totalStaked: v2.totalStake, // v2.totalStake → v1.totalStaked
    numberOfDisputesAsJuror: v2.totalDisputes, // v2.totalDisputes → v1.numberOfDisputesAsJuror
    numberOfDisputesCreated: undefined as unknown as number | bigint | string, // Not available in v2 (creator removed)
    numberOfCoherentVotes: v2.totalCoherentVotes, // Direct mapping
    numberOfVotes: v2.totalResolvedVotes, // v2.totalResolvedVotes → v1.numberOfVotes (approx)
    coherency: v2.coherenceScore, // v2.coherenceScore → v1.coherency
    ethRewards: undefined as unknown as number | bigint | string, // Not available in v2
    tokenRewards: undefined as unknown as number | bigint | string, // Not available in v2
    totalGasCost: undefined as unknown as number | bigint | string, // Not available in v2
  };
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

      return mapUserV2ToJuror(response.data.user);
    },
  });
};

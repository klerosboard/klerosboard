import { USER_V2_QUERY, UserV2 } from '../../graphql/subgraphV2';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../../lib/apolloClient';
import { computeCoherency } from '../../lib/helpers';
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
  const shifts = v2.shifts ?? [];
  const ethRewards = shifts.reduce((sum, s) => sum + BigInt(s.ethAmount), 0n).toString();
  const tokenRewards = shifts.reduce((sum, s) => sum + BigInt(s.pnkAmount), 0n).toString();

  return {
    id: v2.id,
    totalStaked: v2.totalStake,
    numberOfDisputesAsJuror: v2.totalDisputes,
    numberOfDisputesCreated: undefined, // Not available in v2
    numberOfCoherentVotes: v2.totalCoherentVotes,
    numberOfVotes: v2.totalResolvedVotes,
    coherency: computeCoherency(v2.totalCoherentVotes, v2.totalResolvedVotes),
    ethRewards,
    tokenRewards,
    totalGasCost: undefined, // Not applicable in v2
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

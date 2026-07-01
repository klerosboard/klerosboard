import { UserV2 } from '../../../graphql/subgraphV2';
import { Juror } from '../../../graphql/subgraph';
import { computeCoherency } from '../../../lib/helpers';

/**
 * Maps UserV2 to Juror for list views (useJurorsV2).
 * ethRewards and tokenRewards are not available in v2 — shown as '0'.
 */
export function mapUserV2ToJurorList(user: UserV2): Juror {
  return {
    id: user.id,
    totalStaked: user.totalStake,
    numberOfDisputesAsJuror: user.totalDisputes,
    numberOfDisputesCreated: undefined, // Not available in v2
    ethRewards: '0', // Not tracked in v2, show zero
    tokenRewards: '0', // Not tracked in v2, show zero
    coherency: computeCoherency(Number(user.totalCoherentVotes), Number(user.totalResolvedVotes)),
    numberOfCoherentVotes: user.totalCoherentVotes,
    numberOfVotes: user.totalResolvedVotes,
    totalGasCost: undefined, // Not applicable in v2
  };
}

/**
 * Maps UserV2 to Juror for profile views (useProfileV2).
 * ethRewards and tokenRewards are derived from tokenAndETHShifts on the user entity.
 */
export function mapUserV2ToJurorProfile(v2: UserV2): Juror {
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
    coherency: computeCoherency(Number(v2.totalCoherentVotes), Number(v2.totalResolvedVotes)),
    ethRewards,
    tokenRewards,
    totalGasCost: undefined, // Not applicable in v2
  };
}

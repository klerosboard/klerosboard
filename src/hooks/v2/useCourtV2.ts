import { COURT_V2_QUERY, CourtV2 } from '../../graphql/subgraphV2';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../../lib/apolloClient';
import { Court } from '../../graphql/subgraph';

/**
 * Maps v2 CourtV2 to v1-compatible Court shape.
 * v2 is missing: phase-specific dispute counts, eth fees, redistributed tokens, coherency, appeal percentage.
 * v2 has different field names: timesPerPeriod (not timePeriods), numberStakedJurors (not activeJurors).
 * Fallback values are used for missing fields to keep components working gracefully.
 */
function mapCourtV2ToCourt(v2: CourtV2): Court {
  return {
    id: v2.id,
    subcourtID: v2.id as unknown as number | bigint | string, // v2 uses plain id as identifier
    policy: { policy: v2.policy || '' }, // v2.policy is URI string; wrap in object, fallback to ""
    parent: v2.parent || { id: '0' }, // Direct mapping; fallback to root
    childs: (v2.children || []) as unknown as [{ id: string }], // v2.children → v1.childs; fallback to []
    disputesCount: v2.numberDisputes, // v2.numberDisputes → v1.disputesCount
    openDisputes: '0' as unknown as number | bigint | string, // Not available in v2; fallback to 0
    closedDisputes: '0' as unknown as number | bigint | string, // Not available in v2; fallback to 0
    evidencePhaseDisputes: '0' as unknown as number | bigint | string, // Not available in v2; fallback to 0
    commitPhaseDisputes: '0' as unknown as number | bigint | string, // Not available in v2; fallback to 0
    votingPhaseDisputes: '0' as unknown as number | bigint | string, // Not available in v2; fallback to 0
    appealPhaseDisputes: '0' as unknown as number | bigint | string, // Not available in v2; fallback to 0
    ethFees: '0' as unknown as number | bigint | string, // Not available in v2; fallback to 0
    activeJurors: v2.numberStakedJurors, // v2.numberStakedJurors → v1.activeJurors
    disputesNum: v2.numberDisputes, // v2.numberDisputes → v1.disputesNum
    disputesClosed: '0' as unknown as number | bigint | string, // Not available in v2; fallback to 0
    disputesOngoing: '0' as unknown as number | bigint | string, // Not available in v2; fallback to 0
    disputesAppealed: '0' as unknown as number | bigint | string, // Not available in v2; fallback to 0
    feeForJuror: v2.feeForJuror, // Direct mapping
    minStake: v2.minStake, // Direct mapping
    alpha: v2.alpha, // Direct mapping
    tokenStaked: v2.stake, // v2.stake = total PNK staked in this court
    hiddenVotes: v2.hiddenVotes, // Direct mapping
    jurorsForCourtJump: v2.jurorsForCourtJump, // Direct mapping
    timePeriods: v2.timesPerPeriod, // v2.timesPerPeriod → v1.timePeriods
    totalETHFees: v2.paidETH, // v2.paidETH → v1.totalETHFees
    totalTokenRedistributed: v2.paidPNK, // v2.paidPNK → v1.totalTokenRedistributed
    name: v2.name || '', // Direct mapping; fallback to ""
    coherency: '0' as unknown as number | bigint | string, // Not available in v2; fallback to 0
    appealPercentage: '0' as unknown as number | bigint | string, // Not available in v2; fallback to 0
  };
}

export const useCourtV2 = (chainId: string, courtId: string, enabled = true) => {
  return useQuery<Court, Error>({
    queryKey: ['useCourtV2', chainId, courtId],
    queryFn: async (): Promise<Court> => {
      const response = await apolloClientQuery<{ court: CourtV2 }>(chainId, COURT_V2_QUERY, { id: courtId });

      if (!response || !response.data) throw new Error('No response from TheGraph');
      if (!response.data.court) throw new Error('Court not found');

      return mapCourtV2ToCourt(response.data.court);
    },
    enabled: enabled && !!chainId && !!courtId,
  });
};

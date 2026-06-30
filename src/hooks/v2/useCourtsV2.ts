import { COURTS_V2_QUERY, CourtV2 } from '../../graphql/subgraphV2';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../../lib/apolloClient';
import { Court } from '../../graphql/subgraph';

interface Props {
  chainId: string;
  subcourtID?: string;
  enabled?: boolean;
}

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
    openDisputes: v2.numberVotingDisputes, // v2.numberVotingDisputes → v1.openDisputes (approx)
    closedDisputes: v2.numberClosedDisputes, // v2.numberClosedDisputes → v1.closedDisputes
    evidencePhaseDisputes: undefined as unknown as number | bigint | string, // Not available in v2
    commitPhaseDisputes: undefined as unknown as number | bigint | string, // Not available in v2
    votingPhaseDisputes: v2.numberVotingDisputes, // Direct mapping
    appealPhaseDisputes: v2.numberAppealingDisputes, // Direct mapping
    ethFees: '0' as unknown as number | bigint | string, // Not available in v2; fallback to 0
    activeJurors: v2.numberStakedJurors, // v2.numberStakedJurors → v1.activeJurors
    disputesNum: v2.numberDisputes, // v2.numberDisputes → v1.disputesNum
    disputesClosed: v2.numberClosedDisputes, // v2.numberClosedDisputes → v1.disputesClosed
    disputesOngoing: v2.numberVotingDisputes, // v2.numberVotingDisputes → v1.disputesOngoing
    disputesAppealed: v2.numberAppealingDisputes, // v2.numberAppealingDisputes → v1.disputesAppealed
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
    coherency: 'N/A' as unknown as number | bigint | string, // Not available in v2
    appealPercentage: (Number(v2.numberDisputes) > 0
      ? ((Number(v2.numberAppealingDisputes) / Number(v2.numberDisputes)) * 100).toFixed(2)
      : '0') as unknown as number | bigint | string, // calculated from v2 data
  };
}

export const useCourtsV2 = ({ chainId, subcourtID, enabled = true }: Props) => {
  return useQuery<Court[], Error>({
    queryKey: ['useCourtsV2', chainId, subcourtID],
    enabled,
    queryFn: async (): Promise<Court[]> => {
      const response = await apolloClientQuery<{ courts: CourtV2[] }>(chainId, COURTS_V2_QUERY, {
        first: 1000,
        skip: 0,
      });

      if (!response || !response.data) throw new Error('No response from TheGraph');

      let courts = (response.data.courts || []).map(mapCourtV2ToCourt);

      // Filter by subcourtID if provided
      if (subcourtID) {
        courts = courts.filter((c) => c.id === subcourtID);
      }

      return courts;
    },
  });
};

import { Vote } from '../../../graphql/subgraph';

/**
 * Local type for ClassicVote from the v2 subgraph (profile/votes query).
 * This is distinct from ClassicVoteV2 in subgraphV2.ts which is used in the dispute detail query.
 */
export interface ClassicVoteV2Profile {
  id: string;
  choice: string;
  voted: boolean;
  coreDispute: {
    id: string;
    period: string;
    currentRuling: string;
    templateId: string | null;
    lastPeriodChange: string;
    court: { id: string };
  };
  localRound: { id: string };
}

/**
 * Maps a v2 ClassicVote (from profile/votes query) to v1-compatible Vote shape.
 * localRound.id format: "{kitId}-{disputeId}-{roundIndex}" — roundIndex extracted from end.
 * v2 has no exact vote timestamp — lastPeriodChange used as approximation.
 */
export function mapClassicVoteV2ToVote(v: ClassicVoteV2Profile): Vote {
  // localRound.id format: "{kitId}-{disputeId}-{roundIndex}"
  const roundIndex = v.localRound.id.split('-').at(-1) ?? '0';
  const roundId = `${v.coreDispute.id}-${roundIndex}`;

  return {
    id: v.id,
    voted: v.voted,
    choice: v.choice,
    round: { id: roundId },
    address: { id: '' },
    dispute: {
      id: v.coreDispute.id,
      currentRulling: v.coreDispute.currentRuling,
      subcourtID: { id: v.coreDispute.court.id },
      period: v.coreDispute.period,
      arbitrable: { id: '' },
      templateId: v.coreDispute.templateId,
    },
    // v2 has no exact vote timestamp — use lastPeriodChange as approximation
    timestamp: v.coreDispute.lastPeriodChange,
  };
}

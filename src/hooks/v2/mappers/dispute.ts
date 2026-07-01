import { DisputeV2, ClassicVoteV2 } from '../../../graphql/subgraphV2';
import { Dispute, Round, Vote } from '../../../graphql/subgraph';

/** Extends the v1-compatible Dispute with v2-only fields that have no v1 equivalent. */
export interface DisputeWithV2Meta extends Dispute {
  templateId?: string | null;
}

export interface DisputeV2WithVotes extends DisputeV2 {
  rounds?: Array<{
    id: string;
    drawnJurors?: Array<{ id: string; juror: { id: string } }>;
  }>;
  // disputeKitDispute is an array in the v2 subgraph (one entry per dispute kit)
  disputeKitDispute?: Array<{
    id?: string;
    numberOfChoices?: string;
    localRounds?: Array<{
      id: string;
      votes: ClassicVoteV2[];
    }>;
  }>;
}

/**
 * Maps v2 DisputeV2 to v1-compatible Dispute shape (list view).
 * v2 is missing: creator, gas costs, rounds (only currentRoundIndex provided).
 * v2 has field renames: createdAt (not startTime), transactionHash (not txid).
 */
export function mapDisputeV2ToDispute(v2: DisputeV2): Dispute {
  return {
    id: v2.id,
    subcourtID: {
      id: v2.court.id,
      timePeriods: v2.court.timesPerPeriod as unknown as Array<number | bigint | string>, // v2.timesPerPeriod → v1.timePeriods
      policy: { policy: v2.court.policy || '' }, // v2.policy is URI string; wrap in object, fallback to ""
    },
    arbitrable: v2.arbitrated, // v2.arbitrated → v1.arbitrable
    currentRulling: v2.currentRuling ? Number(v2.currentRuling) : 0,
    period: v2.period, // Direct mapping
    lastPeriodChange: v2.lastPeriodChange, // Direct mapping
    startTime: v2.createdAt ? Number(v2.createdAt) : undefined, // v2.createdAt → v1.startTime
    ruled: v2.ruled, // Direct mapping
    rounds: [], // Not available in v2 (only currentRoundIndex)
    txid: v2.transactionHash, // v2.transactionHash → v1.txid
  };
}

/**
 * Maps v2 DisputeV2 (with votes) to v1-compatible Dispute shape (detail view).
 * v2 stores votes in disputeKitDispute.localRounds[].votes (ClassicVote array).
 * v2 is missing: creator, gas costs.
 */
export function mapDisputeV2WithVotesToDispute(v2: DisputeV2WithVotes): DisputeWithV2Meta {
  // Extract votes from disputeKitDispute.localRounds structure
  const rounds: Round[] = [];
  // disputeKitDispute is an array; take the first (and only) entry for classic disputes
  const kitDispute = v2.disputeKitDispute?.[0];
  if (kitDispute?.localRounds) {
    kitDispute.localRounds.forEach((localRound, roundIndex) => {
      // Build a map of juror address → cast vote (if already voted)
      const votedByJuror = new Map<string, ClassicVoteV2>();
      for (const voteV2 of localRound.votes || []) {
        votedByJuror.set(voteV2.juror.id, voteV2);
      }

      // drawnJurors for this round index (parallel array to localRounds)
      const drawnJurors = v2.rounds?.[roundIndex]?.drawnJurors ?? [];

      const votes: Vote[] = drawnJurors.map((drawn, drawIndex) => {
        const jurorId = drawn.juror.id;
        const voteV2 = votedByJuror.get(jurorId);
        const fakeId = voteV2?.id ?? `${localRound.id}-pending-${drawIndex}`;

        return {
          id: fakeId,
          dispute: {
            id: v2.id,
            currentRulling: v2.currentRuling ? Number(v2.currentRuling) : 0,
            subcourtID: { id: v2.court.id },
            period: v2.period,
            arbitrable: v2.arbitrated,
          },
          round: { id: localRound.id },
          address: { id: jurorId },
          voted: voteV2?.voted ?? false,
          choice: voteV2?.choice ? Number(voteV2.choice) : undefined,
          commit: voteV2?.commited ? '0x' : undefined,
        };
      });

      rounds.push({
        id: localRound.id,
        votes,
      });
    });
  }

  return {
    id: v2.id,
    subcourtID: {
      id: v2.court.id,
      timePeriods: v2.court.timesPerPeriod as unknown as Array<number | bigint | string>, // v2.timesPerPeriod → v1.timePeriods
      policy: { policy: v2.court.policy || '' }, // v2.policy is URI string; wrap in object, fallback to ""
    },
    arbitrable: v2.arbitrated, // v2.arbitrated → v1.arbitrable
    currentRulling: v2.currentRuling ? Number(v2.currentRuling) : 0,
    period: v2.period, // Direct mapping
    lastPeriodChange: v2.lastPeriodChange, // Direct mapping
    startTime: v2.createdAt ? Number(v2.createdAt) : undefined, // v2.createdAt → v1.startTime
    ruled: v2.ruled, // Direct mapping
    rounds, // Extracted from disputeKitDispute.localRounds
    txid: v2.transactionHash, // v2.transactionHash → v1.txid
    templateId: v2.templateId, // v2-only: used to fetch metaEvidence from DRT subgraph
  };
}

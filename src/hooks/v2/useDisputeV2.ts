import { DISPUTE_V2_QUERY, DisputeV2, ClassicVoteV2 } from '../../graphql/subgraphV2';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../../lib/apolloClient';
import { Dispute, Round, Vote } from '../../graphql/subgraph';

/** Extends the v1-compatible Dispute with v2-only fields that have no v1 equivalent. */
export interface DisputeWithV2Meta extends Dispute {
  templateId?: string | null;
}

interface DisputeV2WithVotes extends DisputeV2 {
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
 * Maps v2 DisputeV2 (with votes) to v1-compatible Dispute shape.
 * v2 stores votes in disputeKitDispute.localRounds[].votes (ClassicVote array).
 * v2 is missing: creator, gas costs.
 * v2 has field renames: createdAt (not startTime), transactionHash (not txid).
 * Components should gracefully handle undefined fields.
 */
function mapDisputeV2WithVotesToDispute(v2: DisputeV2WithVotes): DisputeWithV2Meta {
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
        winningChoice: undefined as unknown as number | bigint | string,
        startTime: undefined as unknown as number | bigint | string,
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
    creator: undefined as unknown as { id: string }, // Not available in v2
    currentRulling: v2.currentRuling ? Number(v2.currentRuling) : 0,
    period: v2.period, // Direct mapping
    lastPeriodChange: v2.lastPeriodChange, // Direct mapping
    courtName: undefined as unknown as string, // Not available in v2; to be populated by page
    startTime: v2.createdAt ? Number(v2.createdAt) : (undefined as unknown as number), // v2.createdAt → v1.startTime
    ruled: v2.ruled, // Direct mapping
    rounds, // Extracted from disputeKitDispute.localRounds
    txid: v2.transactionHash, // v2.transactionHash → v1.txid
    templateId: v2.templateId, // v2-only: used to fetch metaEvidence from DRT subgraph
  };
}

export const useDisputeV2 = (chainId: string, disputeId: string, enabled = true) => {
  return useQuery<DisputeWithV2Meta, Error>({
    queryKey: ['useDisputeV2', chainId, disputeId],
    queryFn: async (): Promise<DisputeWithV2Meta> => {
      const response = await apolloClientQuery<{ dispute: DisputeV2WithVotes }>(chainId, DISPUTE_V2_QUERY, {
        id: disputeId,
      });

      if (!response || !response.data) throw new Error('No response from TheGraph');
      if (!response.data.dispute) throw new Error('Dispute not found');

      return mapDisputeV2WithVotesToDispute(response.data.dispute);
    },
    enabled: enabled && !!chainId && !!disputeId,
  });
};

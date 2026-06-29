import { DISPUTE_V2_QUERY, DisputeV2, ClassicVoteV2 } from '../../graphql/subgraphV2';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../../lib/apolloClient';
import { Dispute, Round, Vote } from '../../graphql/subgraph';

interface DisputeV2WithVotes extends DisputeV2 {
  disputeKitDispute?: {
    id?: string;
    numberOfChoices?: string;
    localRounds?: Array<{
      id: string;
      votes: ClassicVoteV2[];
    }>;
  };
}

/**
 * Maps v2 DisputeV2 (with votes) to v1-compatible Dispute shape.
 * v2 stores votes in disputeKitDispute.localRounds[].votes (ClassicVote array).
 * v2 is missing: creator, gas costs.
 * v2 has field renames: createdAt (not startTime), transactionHash (not txid).
 * Components should gracefully handle undefined fields.
 */
function mapDisputeV2WithVotesToDispute(v2: DisputeV2WithVotes): Dispute {
  // Extract votes from disputeKitDispute.localRounds structure
  const rounds: Round[] = [];
  if (v2.disputeKitDispute?.localRounds) {
    v2.disputeKitDispute.localRounds.forEach((localRound) => {
      const votes: Vote[] = (localRound.votes || []).map((voteV2: ClassicVoteV2) => ({
        id: voteV2.id,
        dispute: {
          id: v2.id,
          currentRulling: v2.currentRuling ? Number(v2.currentRuling) : 0,
          subcourtID: { id: v2.court.id },
          period: v2.period,
          arbitrable: v2.arbitrated,
        },
        round: { id: localRound.id },
        voteID: undefined as any, // Not available in v2
        address: voteV2.juror, // v2.juror → v1.address
        choice: voteV2.choice ? Number(voteV2.choice) : (undefined as any),
        voted: voteV2.voted, // Direct mapping
        salt: undefined as any, // Not available in v2
        timestamp: undefined as any, // Not available in v2
        commit: voteV2.commited ? '0x' : (undefined as any), // v2.commited → approximate v1.commit
        commitGasUsed: undefined as any, // Not available in v2
        commitGasPrice: undefined as any, // Not available in v2
        commitGasCost: undefined as any, // Not available in v2
        castGasUsed: undefined as any, // Not available in v2
        castGasPrice: undefined as any, // Not available in v2
        castGasCost: undefined as any, // Not available in v2
        totalGasCost: undefined as any, // Not available in v2
      }));

      rounds.push({
        id: localRound.id,
        winningChoice: undefined as any, // Not available in v2
        startTime: undefined as any, // Not available in v2
        votes,
      });
    });
  }

  return {
    id: v2.id,
    subcourtID: {
      id: v2.court.id,
      timePeriods: v2.court.timesPerPeriod as any, // v2.timesPerPeriod → v1.timePeriods
      policy: { policy: v2.court.policy || '' }, // v2.policy is URI string; wrap in object, fallback to ""
    },
    arbitrable: v2.arbitrated, // v2.arbitrated → v1.arbitrable
    creator: undefined as any, // Not available in v2
    currentRulling: v2.currentRuling ? Number(v2.currentRuling) : 0,
    period: v2.period, // Direct mapping
    lastPeriodChange: v2.lastPeriodChange, // Direct mapping
    courtName: undefined as any, // Not available in v2; to be populated by page
    startTime: v2.createdAt ? BigInt(v2.createdAt) : (undefined as any), // v2.createdAt → v1.startTime
    ruled: v2.ruled, // Direct mapping
    rounds, // Extracted from disputeKitDispute.localRounds
    txid: v2.transactionHash, // v2.transactionHash → v1.txid
  };
}

export const useDisputeV2 = (chainId: string, disputeId: string, enabled = true) => {
  return useQuery<Dispute, Error>({
    queryKey: ['useDisputeV2', chainId, disputeId],
    queryFn: async (): Promise<Dispute> => {
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

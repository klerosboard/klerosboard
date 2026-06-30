import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../../lib/apolloClient';
import { Vote } from '../../graphql/subgraph';

interface Props {
  chainId: string;
  jurorID?: string;
  enabled?: boolean;
}

interface ClassicVoteV2 {
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

const CLASSIC_VOTES_QUERY = `
  query ClassicVotesByJuror($jurorId: String!, $first: Int, $skip: Int) {
    classicVotes(
      first: $first
      skip: $skip
      where: { juror_: { id: $jurorId } }
      orderBy: id
      orderDirection: desc
    ) {
      id
      choice
      voted
      coreDispute {
        id
        period
        currentRuling
        templateId
        lastPeriodChange
        court { id }
      }
      localRound { id }
    }
  }
`;

function mapClassicVoteV2ToVote(v: ClassicVoteV2): Vote {
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

export const useVotesV2 = ({ chainId, jurorID, enabled = true }: Props) => {
  return useQuery<Vote[], Error>({
    queryKey: ['useVotesV2', chainId, jurorID],
    enabled: enabled && !!chainId && !!jurorID,
    queryFn: async (): Promise<Vote[]> => {
      const response = await apolloClientQuery<{ classicVotes: ClassicVoteV2[] }>(chainId, CLASSIC_VOTES_QUERY, {
        jurorId: jurorID!.toLowerCase(),
        first: 1000,
        skip: 0,
      });

      if (!response || !response.data) throw new Error('No response from TheGraph');

      return (response.data.classicVotes ?? []).map(mapClassicVoteV2ToVote);
    },
  });
};

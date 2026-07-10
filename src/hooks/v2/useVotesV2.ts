import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../../lib/apolloClient';
import { Vote } from '../../graphql/subgraph';
import { ClassicVoteV2Profile, mapClassicVoteV2ToVote } from './mappers/vote';

interface Props {
  chainId: string;
  jurorID?: string;
  enabled?: boolean;
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

export const useVotesV2 = ({ chainId, jurorID, enabled = true }: Props) => {
  return useQuery<Vote[], Error>({
    queryKey: ['useVotesV2', chainId, jurorID],
    enabled: enabled && !!chainId && !!jurorID,
    queryFn: async (): Promise<Vote[]> => {
      let votes: Vote[] = [];
      let skip = 0;

      // Paginate through all votes
      while (true) {
        const response = await apolloClientQuery<{ classicVotes: ClassicVoteV2Profile[] }>(
          chainId,
          CLASSIC_VOTES_QUERY,
          {
            jurorId: jurorID!.toLowerCase(),
            first: 1000,
            skip: skip,
          },
        );

        if (!response || !response.data) throw new Error('No response from TheGraph');

        const batch = (response.data.classicVotes ?? []).map(mapClassicVoteV2ToVote);
        votes = votes.concat(batch);

        // Stop if this page has fewer than 1000 results
        if (batch.length < 1000) {
          break;
        }

        skip += 1000;
      }

      return votes;
    },
  });
};

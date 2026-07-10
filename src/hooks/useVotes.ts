import { VOTE_FIELDS, Vote } from '../graphql/subgraph';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../lib/apolloClient';
import { buildQuery, QueryVariables } from '../lib/SubgraphQueryBuilder';
import { useVotesV2 } from './v2/useVotesV2';

const query = `
    ${VOTE_FIELDS}
    query VotesQuery(#params#) {
      votes(first: 1000, where:{#where#}, orderBy: timestamp, orderDirection: desc) {
        ...VoteFields
      }
    }
`;

interface Props {
  chainId: string;
  subcourtID?: string;
  jurorID?: string;
}

const useVotesV1 = ({ chainId, subcourtID, jurorID }: Props) => {
  return useQuery<Vote[], Error>({
    queryKey: ['useVotesV1', chainId, subcourtID, jurorID],
    queryFn: async () => {
      const variables: QueryVariables = {};
      if (subcourtID) {
        variables['subcourtID'] = subcourtID.toLowerCase();
      }
      if (jurorID) {
        variables['address'] = jurorID.toLowerCase();
      }

      const response = await apolloClientQuery<{ votes: Vote[] }>(chainId, buildQuery(query, variables), variables);

      if (!response || !response.data) throw new Error('No response from TheGraph');

      return response.data!.votes;
    },
    enabled: !!chainId && chainId !== '42161',
  });
};

export const useVotes = ({ chainId, subcourtID, jurorID }: Props) => {
  const isArbitrum = chainId === '42161';
  // Always call hooks — Rules of Hooks
  const v2Result = useVotesV2({ chainId, jurorID, enabled: isArbitrum });
  const v1Result = useVotesV1({ chainId, subcourtID, jurorID });
  return isArbitrum ? v2Result : v1Result;
};

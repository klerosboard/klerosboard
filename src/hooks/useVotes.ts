import {VOTE_FIELDS, Vote} from "../graphql/subgraph";
import {useQuery} from "@tanstack/react-query";
import {apolloClientQuery} from "../lib/apolloClient";
import { buildQuery, QueryVariables } from "../lib/SubgraphQueryBuilder";

const query = `
    ${VOTE_FIELDS}
    query VotesQuery(#params#) {
      votes(where:{#where#}, orderBy: timestamp, orderDirection: desc) {
        ...VoteFields
      }
    }
`;

interface Props {
  chainId: string
  subcourtID?: string
  jurorID?: string
}

export const useVotes = ({chainId, subcourtID, jurorID}: Props) => {
  return useQuery<Vote[], Error>(
    ["useVotes", chainId, subcourtID, jurorID],
    async () => {
      const variables: QueryVariables = {};
      if (subcourtID) {
        variables['subcourtID'] = subcourtID.toLowerCase();
      }
      if (jurorID) {
        variables['address'] = jurorID.toLowerCase();
      }

      const response = await apolloClientQuery<{ votes: Vote[] }>(chainId, buildQuery(query, variables), variables);

      if (!response) throw new Error("No response from TheGraph");

      return response.data.votes;
    },
    {enabled: !!chainId}
  );
};
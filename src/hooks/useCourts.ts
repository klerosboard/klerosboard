import {Court, COURT_FIELDS} from "../graphql/subgraph";
import {useQuery} from "@tanstack/react-query";
import {apolloClientQuery} from "../lib/apolloClient";
import { buildQuery, QueryVariables } from "../lib/SubgraphQueryBuilder";

const query = `
    ${COURT_FIELDS}
    query CourtsQuery(#params#) {
        courts(first: 1000, where:{#where#}, orderBy: id, orderDirection:asc) {
        ...CourtFields
      }
    }
`;

interface Props {
  chainId: string
  subcourtID?: string
}

export const useCourts = ({chainId, subcourtID}: Props) => {
  return useQuery<Court[], Error>(
    ["useCourts", chainId, subcourtID],
    async () => {
      const variables: QueryVariables = {};

      if (subcourtID) {
        variables['id'] = subcourtID;
      }

      const response = await apolloClientQuery<{ courts: Court[] }>(chainId, buildQuery(query, variables), variables);

      if (!response) throw new Error("No response from TheGraph");

      return response.data.courts;
    }
  );
};
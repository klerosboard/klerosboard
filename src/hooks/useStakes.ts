import {STAKES_FIELDS, StakeSet} from "../graphql/subgraph";
import {useQuery} from "@tanstack/react-query";
import {apolloClientQuery} from "../lib/apolloClient";
import { buildQuery, QueryVariables } from "../lib/SubgraphQueryBuilder";

const query = `
    ${STAKES_FIELDS}
    query StakesQuery(#params#) {
      stakeSets(where:{#where#}, orderBy: timestamp, orderDirection: desc) {
        ...StakeSetFields
      }
    }
`;

export interface Props {
  subcourtID?: number
}

export const useStakes = (chainId:string = '1', {subcourtID}: Props = {}) => {
  return useQuery<StakeSet[], Error>(
    ["useStakes", chainId, subcourtID],
    async () => {
      const variables: QueryVariables = {};
      if (subcourtID){
        variables['subcourtId'] = subcourtID.toString();
      }
      const response = await apolloClientQuery<{ stakeSets: StakeSet[] }>(chainId, buildQuery(query, variables), variables);

      if (!response) throw new Error("No response from TheGraph");

      return response.data.stakeSets;
    },
    {enabled: !!chainId}
  );
};
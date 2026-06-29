import {STAKES_FIELDS, StakeSet} from "../graphql/subgraph";
import {useQuery} from "@tanstack/react-query";
import {apolloClientQuery} from "../lib/apolloClient";
import { buildQuery, QueryVariables } from "../lib/SubgraphQueryBuilder";
import {useStakesV2} from "./v2/useStakesV2";

const query = `
    ${STAKES_FIELDS}
    query StakesQuery(#params#) {
      stakeSets(first: 1000, where:{#where#}, orderBy: timestamp, orderDirection: desc) {
        ...StakeSetFields
      }
    }
`;


interface Props {
  chainId: string
  subcourtID?: string
  jurorID?: string
}

function useStakesV1({chainId, subcourtID, jurorID}: Props) {
  return useQuery<StakeSet[], Error>({
    queryKey: ["useStakesV1", chainId, subcourtID, jurorID],
    queryFn: async () => {
      const variables: QueryVariables = {};

      if (subcourtID) {
        variables['subcourtID'] = subcourtID;
      }
      if (jurorID) {
        variables['address'] = jurorID.toLowerCase();
      }

      const response = await apolloClientQuery<{ stakeSets: StakeSet[] }>(chainId, buildQuery(query, variables), variables);

      if (!response || !response.data) throw new Error("No response from TheGraph");

      return response.data!.stakeSets;
    },
    enabled: !!chainId
  });
}

export const useStakes = ({chainId, subcourtID, jurorID}: Props)  => {
  // Dispatch to v2 hook for Arbitrum (chainId 42161), else v1
  if (chainId === '42161') {
    return useStakesV2({ chainId, jurorID, subcourtID, enabled: true });
  }
  return useStakesV1({chainId, subcourtID, jurorID});
};
import {DISPUTE_FIELDS, Dispute} from "../graphql/subgraph";
import {useQuery} from "@tanstack/react-query";
import {apolloClientQuery} from "../lib/apolloClient";
import { buildQuery, QueryVariables } from "../lib/SubgraphQueryBuilder";

const query = `
    ${DISPUTE_FIELDS}
    query DisputesQuery(#params#) {
      disputes(where:{#where#}, orderBy: id, orderDirection: desc) {
        ...DisputeFields
      }
    }
`;

export interface Props {
  subcourtId?: number
}

export const useDisputes = (chainId:string = '1', {subcourtId}: Props = {}) => {
  return useQuery<Dispute[], Error>(
    ["useDisputes", chainId, subcourtId],
    async () => {
      const variables: QueryVariables = {};
      if (subcourtId){
        variables['subcourtId'] = subcourtId.toString();
      }
      const response = await apolloClientQuery<{ disputes: Dispute[] }>(chainId, buildQuery(query, variables), variables);

      if (!response) throw new Error("No response from TheGraph");

      return response.data.disputes;
    },
    {enabled: !!chainId}
  );
};
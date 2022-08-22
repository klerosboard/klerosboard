import {DISPUTE_FIELDS, Dispute} from "../graphql/subgraph";
import {useQuery} from "@tanstack/react-query";
import {apolloClientQuery} from "../lib/apolloClient";
import { QueryVariables } from "../lib/SubgraphQueryBuilder";

const query = `
    ${DISPUTE_FIELDS}
    query DisputesQuery(#params#) {
        disputes(where: {#where#}) {
        ...DisputeFields
      }
    }
`;

export interface UseDisputesProps {
  subcourtId?: number
}

export const useDisputes = (chainId:string = '1', {subcourtId}: UseDisputesProps = {}) => {
  return useQuery<Dispute[], Error>(
    ["useDisputes", chainId, subcourtId],
    async () => {
      const variables: QueryVariables = {};
      
      if (subcourtId){
        variables['subcourtId'] = subcourtId.toString();
      }
      
      const response = await apolloClientQuery<{ disputes: [Dispute] }>(chainId, query);

      if (!response) throw new Error("No response from TheGraph");

      return response.data.disputes;
    },
    {enabled: !!chainId}
  );
};
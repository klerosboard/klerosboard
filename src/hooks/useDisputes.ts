import {DISPUTE_FIELDS, Dispute} from "../graphql/subgraph";
import {useQuery} from "@tanstack/react-query";
import {apolloClientQuery} from "../lib/apolloClient";
import { buildQuery, QueryVariables } from "../lib/SubgraphQueryBuilder";

const query = `
    ${DISPUTE_FIELDS}
    query DisputesQuery(#params#) {
      disputes(where:{#where#}, orderBy: startTime, orderDirection: desc) {
        ...DisputeFields
      }
    }
`;

interface Props {
  chainId: string
  subcourtID?: string
  arbitrableID?: string
}

export const useDisputes = ({chainId, subcourtID, arbitrableID}: Props) => {
  return useQuery<Dispute[], Error>(
    ["useDisputes", chainId, subcourtID, arbitrableID],
    async () => {
      const variables: QueryVariables = {};
      if (subcourtID){
        variables['subcourtID'] = subcourtID.toLowerCase();
      }
      if (arbitrableID){
        variables['arbitrable'] = arbitrableID.toLowerCase();
      }
      const response = await apolloClientQuery<{ disputes: Dispute[] }>(chainId, buildQuery(query, variables), variables);

      if (!response) throw new Error("No response from TheGraph");

      return response.data.disputes;
    },
    {enabled: !!chainId}
  );
};
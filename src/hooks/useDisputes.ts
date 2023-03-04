import {DISPUTE_FIELDS, Dispute} from "../graphql/subgraph";
import {useQuery} from "@tanstack/react-query";
import {apolloClientQuery} from "../lib/apolloClient";
import { buildQuery, QueryVariables } from "../lib/SubgraphQueryBuilder";

const query = `
    ${DISPUTE_FIELDS}
    query DisputesQuery(#params#) {
      disputes(where:{#where#}, orderBy: startTime, orderDirection: desc, first:1000, skip:$skip) {
        ...DisputeFields
      }
    }
`;

interface Props {
  chainId: string
  subcourtID?: string
  arbitrableID?: string
  creator?: string
}

export const useDisputes = ({chainId, subcourtID, arbitrableID, creator}: Props) => {
  return useQuery<Dispute[], Error>(
    ["useDisputes", chainId, subcourtID, arbitrableID],
    async () => {
        let disputes: Dispute[] = []
        const variables: QueryVariables = {};
        if (subcourtID) {
          variables['subcourtID'] = subcourtID.toLowerCase();
        }
        if (arbitrableID) {
          variables['arbitrable'] = arbitrableID.toLowerCase();
        }
        if (creator) {
          variables['creator'] = creator.toLowerCase();
        }
        variables['skip'] = 0;
        
        let response = await apolloClientQuery<{ disputes: Dispute[] }>(chainId, buildQuery(query, variables), variables);

        if (!response) throw new Error("No response from TheGraph");
        
        disputes = response.data.disputes;
        console.log('first disputes loaded...')
        while (response.data.disputes.length === 1000) {
          console.log('in the while')
          variables['skip'] = disputes.length;
        
          response = await apolloClientQuery<{ disputes: Dispute[] }>(chainId, buildQuery(query, variables), variables);

          if (!response) throw new Error("No response from TheGraph");
          console.log('len', response.data.disputes.length)
          disputes = disputes.concat(response.data.disputes);
        }
        console.log('outside while with len ', disputes.length)
        return disputes;  
    },
    {enabled: !!chainId}
  );
};
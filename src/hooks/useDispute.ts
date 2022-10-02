import {DISPUTEWITHVOTES_FIELDS, Dispute} from "../graphql/subgraph";
import {useQuery} from "@tanstack/react-query";
import {apolloClientQuery} from "../lib/apolloClient";

const query = `
    ${DISPUTEWITHVOTES_FIELDS}
    query DisputeQuery($disputeId: String) {
        dispute(id:$disputeId) {
        ...DisputeWithVotesFields
      }
    }
`;

export const useDispute = (chainId: string = '1', disputeId:string) => {
  return useQuery<Dispute, Error>(
    ["useDispute", chainId, disputeId],
    async () => {
      const response = await apolloClientQuery<{ dispute: Dispute }>(chainId, query, {disputeId:disputeId});

      if (!response) throw new Error("No response from TheGraph");

      return response.data.dispute;
    },
    {enabled: !!chainId}
  );
};
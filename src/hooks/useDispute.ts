import {DISPUTEWITHVOTES_FIELDS, Dispute} from "../graphql/subgraph";
import {useQuery} from "@tanstack/react-query";
import {apolloClientQuery} from "../lib/apolloClient";
import { useDisputeV2 } from "./v2/useDisputeV2";

const query = `
    ${DISPUTEWITHVOTES_FIELDS}
    query DisputeQuery($disputeId: String) {
        dispute(id:$disputeId) {
        ...DisputeWithVotesFields
      }
    }
`;

const useDisputeV1Internal = (chainId: string, disputeId:string, enabled = true) => {
  return useQuery<Dispute, Error>({
    queryKey: ["useDisputeV1", chainId, disputeId],
    queryFn: async () => {
      const response = await apolloClientQuery<{ dispute: Dispute }>(chainId, query, {disputeId:disputeId});

      if (!response || !response.data) throw new Error("No response from TheGraph");

      return response.data!.dispute;
    },
    enabled: enabled && !!chainId,
  });
};

export const useDispute = (chainId: string = '1', disputeId:string) => {
  const isV2 = chainId === '42161';
  const v2 = useDisputeV2(chainId, disputeId, isV2);
  const v1 = useDisputeV1Internal(chainId, disputeId, !isV2);
  return isV2 ? v2 : v1;
};
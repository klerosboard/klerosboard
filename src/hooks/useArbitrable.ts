import {ARBITRABLE_FIELDS, Arbitrable} from "../graphql/subgraph";
import {useQuery} from "@tanstack/react-query";
import {apolloClientQuery} from "../lib/apolloClient";
import {useArbitrableV2} from "./v2/useArbitrableV2";

const query = `
    ${ARBITRABLE_FIELDS}
    query ArbitrableQuery($arbitrableId: String) {
        arbitrable(id:$arbitrableId) {
        ...ArbitrableFields
      }
    }
`;

function useArbitrableV1(chainId: string, arbitrableId?: string) {
  return useQuery<Arbitrable, Error>({
    queryKey: ["useArbitrableV1", chainId, arbitrableId],
    queryFn: async () => {
      const response = await apolloClientQuery<{ arbitrable: Arbitrable }>(chainId, query, {arbitrableId});
      if (!response || !response.data) throw new Error("No response from TheGraph");
      return response.data!.arbitrable;
    },
    enabled: !!chainId && !!arbitrableId,
  });
}

export const useArbitrable = (chainId: string = '1', arbitrableId?:string) => {
  // Dispatch to v2 hook for Arbitrum (chainId 42161), else v1
  if (chainId === '42161' && arbitrableId) {
    return useArbitrableV2({ chainId, arbitrableId, enabled: true });
  }
  return useArbitrableV1(chainId, arbitrableId);
};
import {Arbitrable, ARBITRABLE_FIELDS} from "../graphql/subgraph";
import {useQuery} from "@tanstack/react-query";
import {apolloClientQuery} from "../lib/apolloClient";
import {useArbitrablesV2} from "./v2/useArbitrablesV2";

const query = `
    ${ARBITRABLE_FIELDS}
    query ArbitrablesQuery {
        arbitrables(first: 1000, orderBy: ethFees, orderDirection: desc) {
        ...ArbitrableFields
      }
    }
`;

function useArbitrablesV1(chainId: string) {
  return useQuery<Arbitrable[], Error>({
    queryKey: ["useArbitrablesV1", chainId],
    queryFn: async () => {
      const response = await apolloClientQuery<{ arbitrables: [Arbitrable] }>(chainId, query);
      if (!response || !response.data) throw new Error("No response from TheGraph");
      return response.data!.arbitrables;
    },
    enabled: !!chainId,
  });
}

export const useArbitrables = (chainId: string = '1') => {
  // Dispatch to v2 hook for Arbitrum (chainId 42161), else v1
  if (chainId === '42161') {
    return useArbitrablesV2({ chainId, enabled: true });
  }
  return useArbitrablesV1(chainId);
};
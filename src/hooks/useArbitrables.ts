import {Arbitrable, ARBITRABLE_FIELDS} from "../graphql/subgraph";
import {useQuery} from "@tanstack/react-query";
import {apolloClientQuery} from "../lib/apolloClient";

const query = `
    ${ARBITRABLE_FIELDS}
    query ArbitrablesQuery {
        arbitrables(first: 1000, orderBy: ethFees, orderDirection: desc) {
        ...ArbitrableFields
      }
    }
`;


export const useArbitrables = (chainId: string = '1') => {
  return useQuery<Arbitrable[], Error>(
    ["useArbitrables", chainId],
    async () => {
     
      const response = await apolloClientQuery<{ arbitrables: [Arbitrable] }>(chainId, query);

      if (!response) throw new Error("No response from TheGraph");

      return response.data.arbitrables;
    },
    {enabled: !!chainId}
  );
};
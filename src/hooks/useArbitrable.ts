import {ARBITRABLE_FIELDS, Arbitrable} from "../graphql/subgraph";
import {useQuery} from "@tanstack/react-query";
import {apolloClientQuery} from "../lib/apolloClient";

const query = `
    ${ARBITRABLE_FIELDS}
    query ArbitrableQuery($arbitrableId: String) {
        arbitrable(id:$arbitrableId) {
        ...ArbitrableFields
      }
    }
`;

export const useArbitrable = (chainId: string = '1', arbitrableId?:string) => {
  return useQuery<Arbitrable, Error>(
    ["useArbitrable", chainId, arbitrableId],
    async () => {
      const response = await apolloClientQuery<{ arbitrable: Arbitrable }>(chainId, query, {arbitrableId: arbitrableId});

      if (!response) throw new Error("No response from TheGraph");

      return response.data.arbitrable;
    },
    {enabled: !!chainId && !!arbitrableId}
  );
};
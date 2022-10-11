import { KLEROSCOUNTERS_FIELDS, KlerosCounter } from "../graphql/subgraph";
import { useQuery } from "@tanstack/react-query";
import { apolloClientQuery } from "../lib/apolloClient";

const query = `
    ${KLEROSCOUNTERS_FIELDS}
    query KCQuery {
      klerosCounter(id:"ID") {
        ...KlerosCountersFields
      }
    }
`;

export const useKlerosCounter = (chainId: string = '1') => {
  return useQuery<KlerosCounter, Error>(
    ["useklerosCounter", chainId],
    async () => {      
      const response = await apolloClientQuery<{ klerosCounter: KlerosCounter }>(chainId, query);

      if (!response) throw new Error("No response from TheGraph");
      
      return response.data.klerosCounter;
    }
  );
};
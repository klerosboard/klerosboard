import {KLEROSCOUNTERS_FIELDS, KlerosCounter} from "../graphql/subgraph";
import {useQuery} from "@tanstack/react-query";
import {apolloClientQuery} from "../lib/apolloClient";

const query = `
    ${KLEROSCOUNTERS_FIELDS}
    query KCQuery() {
        klerosCounters(id:"ID") {
        ...KlerosCountersFields
      }
    }
`;

export const useKlerosCounter = (chainId: string = '1') => {
  return useQuery<KlerosCounter, Error>(
    ["useklerosCounter", chainId],
    async () => {
      const response = await apolloClientQuery<{ kc: KlerosCounter }>(chainId, query);

      if (!response) throw new Error("No response from TheGraph");

      return response.data.kc;
    },
    {enabled: !!chainId}
  );
};
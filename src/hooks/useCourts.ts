import {Court, COURT_FIELDS} from "../graphql/subgraph";
import {useQuery} from "@tanstack/react-query";
import {apolloClientQuery} from "../lib/apolloClient";

const query = `
    ${COURT_FIELDS}
    query ArbitrablesQuery(#params#) {
        courts(where: {#where#}) {
        ...CourtFields
      }
    }
`;


export const useCourts = (chainId: string = '1') => {
  return useQuery<Court[], Error>(
    ["useCourts", chainId],
    async () => {
     
      const response = await apolloClientQuery<{ courts: [Court] }>(chainId, query);

      if (!response) throw new Error("No response from TheGraph");

      return response.data.courts;
    },
    {enabled: !!chainId}
  );
};
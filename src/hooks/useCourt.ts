import {COURT_FIELDS, Court} from "../graphql/subgraph";
import {useQuery} from "@tanstack/react-query";
import {apolloClientQuery} from "../lib/apolloClient";

const query = `
    ${COURT_FIELDS}
    query CourtQuery($id: String) {
        court(id:$id) {
        ...CourtFields
      }
    }
`;

export const useCourt = (chainId: string = '1', courtId:string) => {
  return useQuery<Court, Error>(
    ["useCourt", chainId, courtId],
    async () => {
      const response = await apolloClientQuery<{ court: Court }>(chainId, query, {id:courtId});

      if (!response) throw new Error("No response from TheGraph");

      return response.data.court;
    },
    {enabled: !!chainId}
  );
};
import {COURT_FIELDS, Court} from "../graphql/subgraph";
import {useQuery} from "@tanstack/react-query";
import {apolloClientQuery} from "../lib/apolloClient";
import { useCourtV2 } from "./v2/useCourtV2";

const query = `
    ${COURT_FIELDS}
    query CourtQuery($id: String) {
        court(id:$id) {
        ...CourtFields
      }
    }
`;

const useCourtV1Internal = (chainId: string, courtId:string, enabled = true) => {
  return useQuery<Court, Error>({
    queryKey: ["useCourtV1", chainId, courtId],
    queryFn: async () => {
      const response = await apolloClientQuery<{ court: Court }>(chainId, query, {id:courtId});

      if (!response || !response.data) throw new Error("No response from TheGraph");

      return response.data!.court;
    },
    enabled: enabled && !!chainId,
  });
};

export const useCourt = (chainId: string = '1', courtId:string) => {
  const isV2 = chainId === '42161';
  const v2 = useCourtV2(chainId, courtId, isV2);
  const v1 = useCourtV1Internal(chainId, courtId, !isV2);
  return isV2 ? v2 : v1;
};
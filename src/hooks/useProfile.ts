import {JUROR_FIELDS, Juror} from "../graphql/subgraph";
import {useQuery} from "@tanstack/react-query";
import {apolloClientQuery} from "../lib/apolloClient";
import {useProfileV2} from "./v2/useProfileV2";

const query = `
    ${JUROR_FIELDS}
    query JurorQuery($jurorID: String) {
        juror(id:$jurorID) {
        ...JurorFields
      }
    }
`;

function useProfileV1(chainId: string, profileID: string) {
  return useQuery<Juror, Error>({
    queryKey: ["useProfileV1", chainId, profileID],
    queryFn: async () => {
      const response = await apolloClientQuery<{ juror: Juror }>(chainId, query, {jurorID: profileID.toLowerCase()});

      if (!response || !response.data) throw new Error("No response from TheGraph");

      return response.data!.juror;
    },
    enabled: !!chainId
  });
}

export const useProfile = (chainId: string = '1', profileID:string) => {
  // Dispatch to v2 hook for Arbitrum (chainId 42161), else v1
  if (chainId === '42161') {
    return useProfileV2({ chainId, profileID, enabled: true });
  }
  return useProfileV1(chainId, profileID);
};
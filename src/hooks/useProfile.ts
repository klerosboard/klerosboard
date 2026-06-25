import {JUROR_FIELDS, Juror} from "../graphql/subgraph";
import {useQuery} from "@tanstack/react-query";
import {apolloClientQuery} from "../lib/apolloClient";

const query = `
    ${JUROR_FIELDS}
    query JurorQuery($jurorID: String) {
        juror(id:$jurorID) {
        ...JurorFields
      }
    }
`;

export const useProfile = (chainId: string = '1', profileID:string) => {
  return useQuery<Juror, Error>({
    queryKey: ["useProfile", chainId, profileID],
    queryFn: async () => {
      const response = await apolloClientQuery<{ juror: Juror }>(chainId, query, {jurorID: profileID.toLowerCase()});

      if (!response || !response.data) throw new Error("No response from TheGraph");

      return response.data!.juror;
    },
    enabled: !!chainId
  });
};
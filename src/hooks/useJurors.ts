import {JUROR_FIELDS, Juror} from "../graphql/subgraph";
import {useQuery} from "@tanstack/react-query";
import {apolloClientQuery} from "../lib/apolloClient";

const query = `
    ${JUROR_FIELDS}
    query JurorsQuery {
      jurors(where: {totalStaked_gt: "0"}, first: 1000) {
        ...JurorFields
      }
    }
`;

export const useJurors = (chainId: string = '1') => {
  return useQuery<Juror[], Error>(
    ["useJurors", chainId],
    async () => {
      const response = await apolloClientQuery<{ jurors: Juror[] }>(chainId, query)

      if (!response) throw new Error("No response from TheGraph");

      return response.data.jurors;
    },
    {enabled: !!chainId}
  );
};
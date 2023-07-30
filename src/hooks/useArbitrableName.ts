import { LITEM_FIELDS, LItem } from "../graphql/subgraph";
import { useQuery } from "@tanstack/react-query";
import { apolliCurateGnosisQuery } from "../lib/apolloClient";
import { QueryVariables, buildQuery } from "../lib/SubgraphQueryBuilder";
import { shortenIfAddress } from "@usedapp/core";

const query = `
    ${LITEM_FIELDS}
    query ArbitrableNameQuery(#params#) {
      litems(where: {#where#}, first: 1000, orderBy: latestRequestResolutionTime, orderDirection:desc) {
        ...LItemFields
      }
    }
`;

export const useArbitrableName = (
  arbitrableId: string
) => {
  return useQuery<string, Error>(
    ["useArbitrableName"],
    async () => {
      const variables: QueryVariables = {};

      if (arbitrableId) {
        variables["key1"] = arbitrableId.toLowerCase();
        variables["registryAddress"] =
          "0x76944a2678A0954A610096Ee78E8CEB8d46d5922";
      }

      const response = await apolliCurateGnosisQuery<{
        litems: LItem[];
      }>(buildQuery(query, variables), variables);

      if (!response) throw new Error("No response from TheGraph");

      return response.data.litems.length === 0 ? shortenIfAddress(arbitrableId) : response.data.litems[0].key0;
    }
  );
};

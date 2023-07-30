import { LITEM_FIELDS, LItem } from "../graphql/subgraph";
import { useQuery } from "@tanstack/react-query";
import { apolliCurateGnosisQuery } from "../lib/apolloClient";
import { QueryVariables, buildQuery } from "../lib/SubgraphQueryBuilder";

const query = `
    ${LITEM_FIELDS}
    query ArbitrableNamesQuery(#params#) {
      litems(where: {registryAddress: "0x76944a2678A0954A610096Ee78E8CEB8d46d5922"}, first: 1000, orderBy: latestRequestResolutionTime, orderDirection:desc, skip:$skip) {
          ...LItemFields
      }
    }
`;

export const useArbitrablesNames = () => {
  return useQuery<LItem[], Error>(
    ["useArbitrablesNames"],
    async () => {
      let litems: LItem[] = [];
      const variables: QueryVariables = {};

      while (litems.length % 1000 === 0 || litems.length === 0) {
        variables["skip"] = litems.length;

        const response = await apolliCurateGnosisQuery<{
          litems: LItem[];
        }>(buildQuery(query, variables), variables);

        if (!response) throw new Error("No response from TheGraph");
        litems = litems.concat(response.data.litems);
      }
      return litems;
    }
  );
};

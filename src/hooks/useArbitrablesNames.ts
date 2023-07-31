import { LITEM_FIELDS, LItem } from "../graphql/subgraph";
import { useQuery } from "@tanstack/react-query";
import { apolloCurateGnosisQuery, apolloCurateMainnetQuery } from "../lib/apolloClient";
import { QueryVariables, buildQuery } from "../lib/SubgraphQueryBuilder";
import { ADDRESS_TAG_REGISTRY_GNOSIS, ADDRESS_TAG_REGISTRY_MAINNET } from "../lib/helpers";

const query = `
    ${LITEM_FIELDS}
    query ArbitrableNamesQuery(#params#) {
      litems(where: {#where#}, first: 1000, orderBy: latestRequestResolutionTime, orderDirection:asc, skip:$skip) {
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
      // search in gnosis registry
      variables['registryAddress'] = ADDRESS_TAG_REGISTRY_GNOSIS; // gnosis registry
      let iterate: boolean = true
      while (iterate) {
        variables["skip"] = litems.length;

        const response = await apolloCurateGnosisQuery<{
          litems: LItem[];
        }>(buildQuery(query, variables), variables);

        if (!response) throw new Error("No response from TheGraph");
        litems = litems.concat(response.data.litems);
        iterate = response.data.litems.length === 1000;
      }
      const skipOffset = litems.length;
      iterate = true;
      // search in mainnet registry
      variables['registryAddress'] = ADDRESS_TAG_REGISTRY_MAINNET; // mainnet registry
      while (iterate) {
        variables["skip"] = litems.length - skipOffset;
        
        const response2 = await apolloCurateMainnetQuery<{
          litems: LItem[];
        }>(buildQuery(query, variables), variables);

        if (!response2) throw new Error("No response from TheGraph");
        litems = litems.concat(response2.data.litems);
        console.log('mainnet search', variables['skip'], response2.data.litems.length)
        iterate = response2.data.litems.length === 1000;
      }
      return litems;
    }
  );
};

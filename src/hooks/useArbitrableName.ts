import { LITEM_FIELDS, LItem } from "../graphql/subgraph";
import { useQuery } from "@tanstack/react-query";
import {
  apolloCurateGnosisQuery,
  apolloCurateMainnetQuery,
} from "../lib/apolloClient";
import { QueryVariables, buildQuery } from "../lib/SubgraphQueryBuilder";
import { shortenIfAddress } from "@usedapp/core";
import {
  ADDRESS_TAG_REGISTRY_GNOSIS,
  ADDRESS_TAG_REGISTRY_MAINNET,
} from "../lib/helpers";

const query = `
    ${LITEM_FIELDS}
    query ArbitrableNameQuery(#params#) {
      litems(where: {#where#}, first: 1000, orderBy: latestRequestResolutionTime, orderDirection:desc) {
        ...LItemFields
      }
    }
`;

export const useArbitrableName = (arbitrableId: string) => {
  return useQuery<string, Error>(["useArbitrableName"], async () => {
    const variables: QueryVariables = {};
    let name: string = shortenIfAddress(arbitrableId);

    if (arbitrableId) {
      variables["keywords_contains_nocase"] = arbitrableId.toLowerCase();
      variables["registryAddress"] = ADDRESS_TAG_REGISTRY_GNOSIS;
    }

    const response = await apolloCurateGnosisQuery<{
      litems: LItem[];
    }>(buildQuery(query, variables), variables);

    if (!response) throw new Error("No response from TheGraph");
    if (response.data.litems.length !== 0) {
      name = response.data.litems[0].keywords.split(" | ")[1];
    } else {
      // search in mainnet list
      variables["registryAddress"] = ADDRESS_TAG_REGISTRY_MAINNET;

      const response2 = await apolloCurateMainnetQuery<{
        litems: LItem[];
      }>(buildQuery(query, variables), variables);

      if (!response2) throw new Error("No response from TheGraph");

      if (response2.data.litems.length !== 0) {
        name = response2.data.litems[0].keywords.split(" | ")[1];
      }
    }
    return name;
  });
};

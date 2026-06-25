import { KLEROSCOUNTERS_FIELDS, KlerosCounter } from "../graphql/subgraph";
import { useQuery } from "@tanstack/react-query";
import { apolloClientQuery } from "../lib/apolloClient";
import { getBlockByDate } from "../lib/helpers";

const query = `
    ${KLEROSCOUNTERS_FIELDS}
    query KCQuery {
      klerosCounter(id:"ID") {
        ...KlerosCountersFields
      }
    }
`;

const queryRel = `
    ${KLEROSCOUNTERS_FIELDS}
    query KCQuery($blockNumber: Int!) {
      klerosCounter(id:"ID", block:{number:$blockNumber}) {
        ...KlerosCountersFields
      }
    }
`;

interface Props {
  chainId: string
  relTimestamp?: string | Date
}

export const useKlerosCounter = ({ chainId, relTimestamp }: Props) => {
  return useQuery<KlerosCounter, Error>({
    queryKey: ["useklerosCounter", chainId, relTimestamp],
    queryFn: async (): Promise<KlerosCounter> => {

      let response: Awaited<ReturnType<typeof apolloClientQuery<{ klerosCounter: KlerosCounter }>>>
      if (relTimestamp) {
        const blockNumber = (await getBlockByDate(relTimestamp, chainId)).block;

        if (!blockNumber) throw new Error("No response from Infura");;
        response = await apolloClientQuery<{ klerosCounter: KlerosCounter }>(chainId, queryRel, { blockNumber: blockNumber });
      } else {
        response = await apolloClientQuery<{ klerosCounter: KlerosCounter }>(chainId, query);
      }
      if (!response) throw new Error("No response from TheGraph");
      if (!response.data) throw new Error("No data from TheGraph");

      return response.data.klerosCounter as KlerosCounter;
    }
  });
};
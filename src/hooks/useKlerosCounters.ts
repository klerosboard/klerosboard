import { KLEROSCOUNTERS_FIELDS, KlerosCounter } from "../graphql/subgraph";
import { useQuery } from "@tanstack/react-query";
import { apolloClientQuery } from "../lib/apolloClient";
import { getBlockByDate } from "../lib/helpers";
import { ApolloQueryResult } from "@apollo/client";

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
  return useQuery<KlerosCounter, Error>(
    ["useklerosCounter", chainId, relTimestamp],
    async () => {

      let response: ApolloQueryResult<{ klerosCounter: KlerosCounter }> | undefined
      if (relTimestamp) {
        const blockNumber = (await getBlockByDate(relTimestamp, chainId)).block;

        if (!blockNumber) throw new Error("No response from Infura");;
        response = await apolloClientQuery<{ klerosCounter: KlerosCounter }>(chainId, queryRel, { blockNumber: blockNumber });
      } else {
        response = await apolloClientQuery<{ klerosCounter: KlerosCounter }>(chainId, query);
      }
      if (!response) throw new Error("No response from TheGraph");

      return response.data.klerosCounter;
    }
  );
};
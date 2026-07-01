import { KLEROSCOUNTERS_FIELDS, KlerosCounter } from '../graphql/subgraph';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../lib/apolloClient';
import { getBlockByDate } from '../lib/helpers';
import { useKlerosCounterV2 } from './v2/useKlerosCounterV2';

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
  chainId: string;
  relTimestamp?: string | Date;
}

const useKlerosCounterV1 = ({ chainId, relTimestamp, enabled = true }: Props & { enabled?: boolean }) => {
  return useQuery<KlerosCounter, Error>({
    queryKey: ['useklerosCounterV1', chainId, relTimestamp],
    queryFn: async (): Promise<KlerosCounter> => {
      let response: Awaited<ReturnType<typeof apolloClientQuery<{ klerosCounter: KlerosCounter }>>>;
      if (relTimestamp) {
        const blockNumber = (await getBlockByDate(relTimestamp, chainId)).block;

        if (!blockNumber) throw new Error('No response from Infura');
        response = await apolloClientQuery<{ klerosCounter: KlerosCounter }>(chainId, queryRel, {
          blockNumber: blockNumber,
        });
      } else {
        response = await apolloClientQuery<{ klerosCounter: KlerosCounter }>(chainId, query);
      }
      if (!response || !response.data) throw new Error('No response from TheGraph');
      if (!response.data.klerosCounter) throw new Error('KlerosCounter entity not found');

      return response.data.klerosCounter;
    },
    enabled,
  });
};

export const useKlerosCounter = ({ chainId, relTimestamp }: Props) => {
  const isV2 = chainId === '42161';
  const v2 = useKlerosCounterV2({ chainId, relTimestamp, enabled: isV2 });
  const v1 = useKlerosCounterV1({ chainId, relTimestamp, enabled: !isV2 });
  return isV2 ? v2 : v1;
};

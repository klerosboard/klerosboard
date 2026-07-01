import { COUNTER_V2_QUERY, COUNTER_SNAPSHOT_V2_QUERY, CounterV2 } from '../../graphql/subgraphV2';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../../lib/apolloClient';
import { KlerosCounter } from '../../graphql/subgraph';
import { mapCounterV2ToKlerosCounter } from './mappers/counter';

interface Props {
  chainId: string;
  enabled?: boolean;
  relTimestamp?: string | Date; // if provided, fetches the closest historical snapshot
}

export const useKlerosCounterV2 = ({ chainId, enabled = true, relTimestamp }: Props) => {
  return useQuery<KlerosCounter, Error>({
    queryKey: ['useKlerosCounterV2', chainId, relTimestamp?.toString()],
    enabled,
    queryFn: async (): Promise<KlerosCounter> => {
      if (relTimestamp) {
        // Fetch closest snapshot at or before relTimestamp
        const unixTs = Math.floor(new Date(relTimestamp).getTime() / 1000).toString();
        const response = await apolloClientQuery<{ counters: CounterV2[] }>(chainId, COUNTER_SNAPSHOT_V2_QUERY, {
          timestamp: unixTs,
        });
        if (!response || !response.data) throw new Error('No response from TheGraph');
        if (!response.data.counters || response.data.counters.length === 0) {
          throw new Error('No historical counter snapshot found');
        }
        return mapCounterV2ToKlerosCounter(response.data.counters[0]);
      }

      const response = await apolloClientQuery<{ counters: CounterV2[] }>(chainId, COUNTER_V2_QUERY);
      if (!response || !response.data) throw new Error('No response from TheGraph');
      if (!response.data.counters || response.data.counters.length === 0) {
        throw new Error('Counter entity not found');
      }
      return mapCounterV2ToKlerosCounter(response.data.counters[0]);
    },
  });
};

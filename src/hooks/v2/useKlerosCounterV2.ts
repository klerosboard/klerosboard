import { COUNTER_V2_QUERY, COUNTER_SNAPSHOT_V2_QUERY, CounterV2 } from '../../graphql/subgraphV2';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../../lib/apolloClient';
import { KlerosCounter } from '../../graphql/subgraph';

interface Props {
  chainId: string;
  enabled?: boolean;
  relTimestamp?: string | Date; // if provided, fetches the closest historical snapshot
}

/**
 * Maps v2 CounterV2 to v1-compatible KlerosCounter shape.
 * v2 is missing: courtsCount, phase dispute counts.
 * paidETH and redistributedPNK are available and mapped.
 */
function mapCounterV2ToKlerosCounter(v2: CounterV2): KlerosCounter {
  return {
    id: v2.id,
    courtsCount: undefined as unknown as number | bigint | string, // Not available in v2
    disputesCount: v2.cases, // v2.cases → v1.disputesCount
    openDisputes: v2.casesVoting, // v2.casesVoting → v1.openDisputes (approx)
    closedDisputes: v2.casesRuled, // v2.casesRuled → v1.closedDisputes (approx)
    evidencePhaseDisputes: undefined as unknown as number | bigint | string, // Not available in v2
    commitPhaseDisputes: undefined as unknown as number | bigint | string, // Not available in v2
    votingPhaseDisputes: undefined as unknown as number | bigint | string, // Not available in v2
    appealPhaseDisputes: undefined as unknown as number | bigint | string, // Not available in v2
    activeJurors: v2.activeJurors, // Direct mapping
    inactiveJurors: undefined as unknown as number | bigint | string, // Not available in v2
    drawnJurors: undefined as unknown as number | bigint | string, // Not available in v2
    numberOfArbitrables: undefined as unknown as number | bigint | string, // Not available in v2
    tokenStaked: v2.stakedPNK, // v2.stakedPNK → v1.tokenStaked
    totalETHFees: v2.paidETH, // v2.paidETH → v1.totalETHFees
    totalTokenRedistributed: v2.redistributedPNK, // v2.redistributedPNK → v1.totalTokenRedistributed
    totalUSDthroughContract: undefined as unknown as number | bigint | string, // Not available in v2
  };
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

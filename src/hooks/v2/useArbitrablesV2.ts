import { ARBITRABLES_V2_QUERY, ArbitrableV2 } from '../../graphql/subgraphV2';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../../lib/apolloClient';
import { Arbitrable } from '../../graphql/subgraph';

interface Props {
  chainId: string;
  enabled?: boolean;
}

/**
 * Maps v2 ArbitrableV2[] to v1-compatible Arbitrable[] shape.
 * v2 schema is severely limited: only id + totalDisputes available.
 * All other fields (phase counts, fees, disputes detail) return 0 or undefined.
 * Components should gracefully handle this limited data.
 */
function mapArbitrableV2ToArbitrable(v2: ArbitrableV2): Arbitrable {
  return {
    id: v2.id,
    disputesCount: v2.totalDisputes, // Direct mapping
    openDisputes: undefined as unknown as number, // Not available in v2
    closedDisputes: undefined as unknown as number, // Not available in v2
    evidencePhaseDisputes: undefined as unknown as number, // Not available in v2
    commitPhaseDisputes: undefined as unknown as number, // Not available in v2
    votingPhaseDisputes: undefined as unknown as number, // Not available in v2
    appealPhaseDisputes: undefined as unknown as number, // Not available in v2
    ethFees: undefined as unknown as number, // Not available in v2
    disputes: [] as unknown as Arbitrable['disputes'], // Not available in v2 (disputes detail not fetched)
  };
}

export const useArbitrablesV2 = ({ chainId, enabled = true }: Props) => {
  return useQuery<Arbitrable[], Error>({
    queryKey: ['useArbitrablesV2', chainId],
    enabled: enabled && !!chainId,
    queryFn: async (): Promise<Arbitrable[]> => {
      const response = await apolloClientQuery<{ arbitrables: ArbitrableV2[] }>(chainId, ARBITRABLES_V2_QUERY, {
        first: 1000,
        skip: 0,
      });

      if (!response || !response.data) throw new Error('No response from TheGraph');
      if (!response.data.arbitrables) {
        return [];
      }

      return response.data.arbitrables.map(mapArbitrableV2ToArbitrable);
    },
  });
};

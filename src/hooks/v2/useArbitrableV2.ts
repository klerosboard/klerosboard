import { ARBITRABLE_V2_QUERY, ArbitrableV2 } from '../../graphql/subgraphV2';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../../lib/apolloClient';
import { Arbitrable } from '../../graphql/subgraph';

interface Props {
  chainId: string;
  arbitrableId: string;
  enabled?: boolean;
}

/**
 * Maps v2 ArbitrableV2 to v1-compatible Arbitrable shape.
 * v2 limitations: no phase counts, no ethFees, no subcourtID/creator/txid on disputes.
 * Available: id, totalDisputes, and per-dispute: disputeID, period, ruled, createdAt.
 */
function mapArbitrableV2ToArbitrable(v2: ArbitrableV2): Arbitrable {
  const totalFees = (v2.disputes ?? []).reduce((acc, d) => {
    const disputeFees = (d.rounds ?? []).reduce((sum, r) => sum + BigInt(r.totalFeesForJurors), 0n);
    return acc + disputeFees;
  }, 0n);

  return {
    id: v2.id,
    disputesCount: v2.totalDisputes,
    ethFees: totalFees.toString(),
    disputes: (v2.disputes ?? []).map((d) => ({
      id: d.disputeID,
      period: d.period,
      lastPeriodChange: d.createdAt,
      startTime: d.createdAt,
      ruled: d.ruled,
    })),
  };
}

export const useArbitrableV2 = ({ chainId, arbitrableId, enabled = true }: Props) => {
  return useQuery<Arbitrable, Error>({
    queryKey: ['useArbitrableV2', chainId, arbitrableId],
    enabled: enabled && !!chainId && !!arbitrableId,
    queryFn: async (): Promise<Arbitrable> => {
      const response = await apolloClientQuery<{ arbitrable: ArbitrableV2 }>(chainId, ARBITRABLE_V2_QUERY, {
        id: arbitrableId,
      });

      if (!response || !response.data) throw new Error('No response from TheGraph');
      if (!response.data.arbitrable) {
        throw new Error('Arbitrable not found');
      }

      return mapArbitrableV2ToArbitrable(response.data.arbitrable);
    },
  });
};

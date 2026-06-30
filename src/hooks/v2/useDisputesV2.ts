import { DISPUTES_V2_QUERY, DisputeV2 } from '../../graphql/subgraphV2';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../../lib/apolloClient';
import { Dispute } from '../../graphql/subgraph';

interface Props {
  chainId: string;
  subcourtID?: string;
  arbitrableID?: string;
  creator?: string;
  enabled?: boolean;
}

/**
 * Maps v2 DisputeV2 to v1-compatible Dispute shape.
 * v2 is missing: creator, gas costs, rounds (only currentRoundIndex provided).
 * v2 has field renames: createdAt (not startTime), transactionHash (not txid).
 * Components should gracefully handle undefined fields.
 */
function mapDisputeV2ToDispute(v2: DisputeV2): Dispute {
  return {
    id: v2.id,
    subcourtID: {
      id: v2.court.id,
      timePeriods: v2.court.timesPerPeriod as unknown as Array<number | bigint | string>, // v2.timesPerPeriod → v1.timePeriods
      policy: { policy: v2.court.policy || '' }, // v2.policy is URI string; wrap in object, fallback to ""
    },
    arbitrable: v2.arbitrated, // v2.arbitrated → v1.arbitrable
    creator: undefined as unknown as { id: string }, // Not available in v2
    currentRulling: v2.currentRuling ? Number(v2.currentRuling) : 0,
    period: v2.period, // Direct mapping
    lastPeriodChange: v2.lastPeriodChange, // Direct mapping
    courtName: undefined as unknown as string, // Not available in v2; to be populated by page
    startTime: v2.createdAt ? Number(v2.createdAt) : (undefined as unknown as number), // v2.createdAt → v1.startTime
    ruled: v2.ruled, // Direct mapping
    rounds: [], // Not available in v2 (only currentRoundIndex)
    txid: v2.transactionHash, // v2.transactionHash → v1.txid
  };
}

export const useDisputesV2 = ({ chainId, subcourtID, arbitrableID, creator, enabled = true }: Props) => {
  return useQuery<Dispute[], Error>({
    queryKey: ['useDisputesV2', chainId, subcourtID, arbitrableID, creator],
    queryFn: async (): Promise<Dispute[]> => {
      let disputes: Dispute[] = [];

      // Fetch paginated disputes (v2 schema may differ; adjust as needed)
      const response = await apolloClientQuery<{ disputes: DisputeV2[] }>(chainId, DISPUTES_V2_QUERY, {
        first: 1000,
        skip: 0,
      });

      if (!response || !response.data) throw new Error('No response from TheGraph');

      disputes = (response.data.disputes || []).map(mapDisputeV2ToDispute);

      // Note: v2 schema does not support filtering by creator on the query level.
      // Apply client-side filters if provided (though this is less optimal than server-side).
      // For now, we skip filtering since v2 limits filtering options.
      if (subcourtID) {
        disputes = disputes.filter((d) => d.subcourtID.id === subcourtID);
      }
      if (arbitrableID) {
        disputes = disputes.filter((d) => d.arbitrable.id === arbitrableID.toLowerCase());
      }

      return disputes;
    },
    enabled: enabled && !!chainId,
  });
};

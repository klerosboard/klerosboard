import { ARBITRABLE_V2_QUERY, ArbitrableV2 } from "../../graphql/subgraphV2";
import { useQuery } from "@tanstack/react-query";
import { apolloClientQuery } from "../../lib/apolloClient";
import { Arbitrable } from "../../graphql/subgraph";

interface Props {
  chainId: string;
  arbitrableId: string;
  enabled?: boolean;
}

/**
 * Maps v2 ArbitrableV2 to v1-compatible Arbitrable shape (single).
 * v2 schema is severely limited: only id + totalDisputes available.
 * All other fields (phase counts, fees, disputes detail) return 0 or undefined.
 * Components should gracefully handle this limited data.
 */
function mapArbitrableV2ToArbitrable(v2: ArbitrableV2): Arbitrable {
  return {
    id: v2.id,
    disputesCount: v2.totalDisputes,                        // Direct mapping
    openDisputes: undefined as any,                         // Not available in v2
    closedDisputes: undefined as any,                       // Not available in v2
    evidencePhaseDisputes: undefined as any,               // Not available in v2
    commitPhaseDisputes: undefined as any,                 // Not available in v2
    votingPhaseDisputes: undefined as any,                 // Not available in v2
    appealPhaseDisputes: undefined as any,                 // Not available in v2
    ethFees: undefined as any,                             // Not available in v2
    disputes: [] as any,                                    // Not available in v2
  };
}

export const useArbitrableV2 = ({ chainId, arbitrableId, enabled = true }: Props) => {
  return useQuery<Arbitrable, Error>({
    queryKey: ["useArbitrableV2", chainId, arbitrableId],
    enabled: enabled && !!chainId && !!arbitrableId,
    queryFn: async (): Promise<Arbitrable> => {
      const response = await apolloClientQuery<{ arbitrable: ArbitrableV2 }>(
        chainId,
        ARBITRABLE_V2_QUERY,
        { id: arbitrableId }
      );

      if (!response || !response.data) throw new Error("No response from TheGraph");
      if (!response.data.arbitrable) {
        throw new Error("Arbitrable not found");
      }

      return mapArbitrableV2ToArbitrable(response.data.arbitrable);
    },
  });
};

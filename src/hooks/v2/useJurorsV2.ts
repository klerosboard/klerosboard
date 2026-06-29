import { useQuery } from "@tanstack/react-query";
import { apolloClientQuery } from "../../lib/apolloClient";
import { Juror } from "../../graphql/subgraph";
import { UserV2, USERS_V2_QUERY } from "../../graphql/subgraphV2";

/**
 * Maps UserV2 to Juror shape for Arbitrum v2
 * Normalizes v2 schema to v1 interface
 * 
 * Known limitations (not available in v2):
 * - numberOfDisputesCreated (creator field removed in v2)
 * - ethRewards, tokenRewards (not tracked in v2)
 * - totalGasCost (not available in v2)
 */
function mapUserV2ToJuror(user: UserV2): Juror {
  return {
    id: user.id,
    totalStaked: user.totalStake,
    numberOfDisputesAsJuror: user.totalDisputes,
    numberOfDisputesCreated: "0", // Not available in v2 (creator removed)
    ethRewards: "0", // Not available in v2
    tokenRewards: "0", // Not available in v2
    coherency: user.coherenceScore,
    numberOfCoherentVotes: user.totalCoherentVotes,
    numberOfVotes: user.totalResolvedVotes,
    totalGasCost: "0", // Not available in v2
  };
}

export const useJurorsV2 = (chainId: string = "42161") => {
  return useQuery<Juror[], Error>({
    queryKey: ["useJurorsV2", chainId],
    queryFn: async () => {
      const response = await apolloClientQuery<{ users: UserV2[] }>(
        chainId,
        USERS_V2_QUERY,
        { first: 1000, skip: 0 }
      );

      if (!response || !response.data) throw new Error("No response from TheGraph");

      return response.data!.users.map(mapUserV2ToJuror);
    },
    enabled: !!chainId,
  });
};

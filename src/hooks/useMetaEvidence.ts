import { useQuery } from "@tanstack/react-query";
import { fetchMetaEvidence } from "../lib/fetchMetaEvidence";
import { MetaEvidence } from "../lib/types";

export const useMetaEvidence = (
  chainId: string = "1",
  arbitrableId: string | undefined,
  disputeId: string
): { metaEvidence: MetaEvidence | undefined; error: string | undefined } => {
  const { data, error } = useQuery<MetaEvidence, Error>({
    queryKey: ["metaEvidence", chainId, arbitrableId, disputeId],
    queryFn: () =>
      fetchMetaEvidence({
        chainId,
        arbitrableId: arbitrableId!,
        disputeId,
      }),
    enabled: !!chainId && !!arbitrableId && !!disputeId,
  });

  return { metaEvidence: data, error: error?.message };
};

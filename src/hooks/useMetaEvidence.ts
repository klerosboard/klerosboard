import { useEffect, useState } from "react";
import {
  fetchMetaEvidence,
} from "../lib/helpers";
import { MetaEvidence } from "../lib/types";

export const useMetaEvidence = (
  chainId: string = "1",
  arbitrableId: string | undefined,
  disputeId: string
): { metaEvidence: MetaEvidence | undefined; error: string | undefined } => {
  const [metaEvidence, setMetaEvidence] = useState<undefined | MetaEvidence>(
    undefined
  );
  const [error, setError] = useState<undefined | string>(undefined);


  useEffect(() => {
    const fetchMetaEvidenceData = async () => {
      if (arbitrableId && disputeId) {
        try {
          const metaEvidenceResult = await fetchMetaEvidence({
            chainId,
            arbitrableId,
            disputeId,
          });
          setMetaEvidence(metaEvidenceResult);
        } catch (error: any) {
          setError(error.message);
        }
      }
    };

    fetchMetaEvidenceData();
  }, [arbitrableId, chainId, disputeId]);

  return { metaEvidence: metaEvidence, error: error };
};

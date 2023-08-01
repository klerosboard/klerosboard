import { useEffect, useState } from "react";
import { getArchon } from "../lib/archonClient";
import { GNOSIS_KLEROSLIQUID, MAINNET_KLEROSLIQUID } from "../lib/helpers";
import { ArchonDispute, Evidence } from "../lib/types";

export const useEvidence = (
  chainId: string = "1",
  arbitrableId: string | undefined,
  disputeId: string
): { evidences: Evidence[] | undefined; error: string | undefined } => {
  const [evidence, setEvidence] = useState<undefined | Evidence[]>(undefined);
  const [error, setError] = useState<undefined | string>(undefined);
  const archon = getArchon(chainId);
  const KL = chainId === "100" ? GNOSIS_KLEROSLIQUID : MAINNET_KLEROSLIQUID;

  useEffect(() => {
    async function fetchEvidence() {
        archon.arbitrable
          .getDispute(arbitrableId, KL, disputeId)
          .then((metaEvidence: ArchonDispute) => {
            archon.arbitrable
              .getEvidence(arbitrableId, KL, metaEvidence.evidenceGroupID)
              .then((evidence: Evidence[]) => {
                setEvidence(evidence);
              }).catch((error: Error) => {setError(error.message)});
          }).catch((error: Error) => {setError(error.message)});
    }
    if (arbitrableId && disputeId) {
      fetchEvidence();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arbitrableId, chainId, KL, disputeId]);

  return { evidences: evidence, error: error };
};

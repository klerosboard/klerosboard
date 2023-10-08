import { useEffect, useState } from "react";
import { getArchon } from "../lib/archonClient";
import {
  getRPCURL,
  GNOSIS_KLEROSLIQUID,
  MAINNET_KLEROSLIQUID,
} from "../lib/helpers";
import { ArchonDispute, MetaEvidence } from "../lib/types";

export const useMetaEvidence = (
  chainId: string = "1",
  arbitrableId: string | undefined,
  disputeId: string
): { metaEvidence: MetaEvidence | undefined; error: string | undefined } => {
  const [metaEvidence, setMetaEvidence] = useState<undefined | MetaEvidence>(
    undefined
  );
  const [error, setError] = useState<undefined | string>(undefined);
  const archon = getArchon(chainId);
  const KL = chainId === "100" ? GNOSIS_KLEROSLIQUID : MAINNET_KLEROSLIQUID;

  useEffect(() => {
    async function fetchMetaevidence() {
      archon.arbitrable
        .getDispute(arbitrableId, KL, disputeId)
        .then((dispute: ArchonDispute) => {
          archon.arbitrable
            .getMetaEvidence(arbitrableId, dispute.metaEvidenceID, {
              strict: true,
              scriptParameters: {
                disputeID: disputeId,
                arbitrableContractAddress: arbitrableId,
                arbitratorContractAddress: KL,
                arbitratorChainID: chainId,
                arbitrableChainID: chainId,
                arbitratorJsonRpcUrl: getRPCURL(chainId),
                arbitrableJsonRpcUrl: getRPCURL(chainId),
              },
            })
            .then((metaEvidence: MetaEvidence) => {
              setMetaEvidence(metaEvidence);
            })
            .catch((error: Error) => {
              const pattern =
                /MetaEvidence requires 'arbitrableChainID' to be (\d+)/;
              const match = pattern.exec(error.message);
              // Check if a match was found and extract the crosschain chainID.
              if (match) {
                const arbitrableChainid = match[1];
                archon.arbitrable
                  .getMetaEvidence(arbitrableId, dispute.metaEvidenceID, {
                    strict: true,
                    scriptParameters: {
                      disputeID: disputeId,
                      arbitrableContractAddress: arbitrableId,
                      arbitratorContractAddress: KL,
                      arbitratorChainID: chainId,
                      arbitrableChainID: arbitrableChainid,
                      arbitratorJsonRpcUrl: getRPCURL(chainId),
                      arbitrableJsonRpcUrl: getRPCURL(arbitrableChainid),
                    },
                  })
                  .then((metaEvidence: MetaEvidence | undefined) => {
                   setMetaEvidence(metaEvidence);
                  })
                  .catch((error: Error) => {
                    setError(error.message);
                  });
              } else {
                setError(error.message);
              }
            });
        })
        .catch((error: Error) => {
          setError(error.message);
        });
    }
    if (arbitrableId && disputeId) {
      fetchMetaevidence();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arbitrableId, chainId, KL, disputeId]);

  return { metaEvidence: metaEvidence, error: error };
};

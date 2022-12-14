import { useEffect, useState } from 'react'
import { getArchon } from "../lib/archonClient";
import { getRPCURL, GNOSIS_KLEROSLIQUID, MAINNET_KLEROSLIQUID } from "../lib/helpers";
import { MetaEvidence } from "../lib/types";


export const useMetaEvidence = (chainId: string = '1', arbitrableId: string | undefined, disputeId: string): { metaEvidence: MetaEvidence | undefined, error: string | undefined } => {
  const [metaEvidence, setMetaEvidence] = useState<undefined | MetaEvidence>(undefined)
  const [error, setError] = useState<undefined | string>(undefined)
  const archon = getArchon(chainId);
  const KL = chainId === '100' ? GNOSIS_KLEROSLIQUID : MAINNET_KLEROSLIQUID;

  useEffect(() => {
    async function fetchMetaevidence() {
      try {
        const response = await archon.arbitrable.getDispute(arbitrableId, KL, disputeId);
        const _metaEvidence: MetaEvidence = await archon.arbitrable.getMetaEvidence(arbitrableId, response.metaEvidenceID, {
          strict: true,
          scriptParameters: {
            disputeID: disputeId,
            arbitrableContractAddress: arbitrableId,
            arbitratorContractAddress: KL,
            arbitratorChainID: chainId,
            arbitrableChainID: chainId,
            arbitratorJsonRpcUrl: getRPCURL(chainId),
            arbitrableJsonRpcUrl: getRPCURL(chainId)
          },
        });

        setMetaEvidence(_metaEvidence);
      } catch {
        setError("Error trying to read metaEvidence");
      }

    }
    if (arbitrableId && disputeId) {
      fetchMetaevidence()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arbitrableId, chainId, KL, disputeId])

  return { metaEvidence: metaEvidence, error: error }
}
import { useEffect, useState } from 'react'
import { getArchon } from "../lib/archonClient";
import { GNOSIS_KLEROSLIQUID, MAINNET_KLEROSLIQUID } from "../lib/helpers";
import { MetaEvidence } from "../lib/types";


export const useMetaEvidence = (chainId: string = '1', arbitrableId: string|undefined, disputeId: string): MetaEvidence | undefined => {
  const [metaEvidence, setMetaEvidence] = useState<undefined | MetaEvidence>(undefined)
  const archon = getArchon(chainId);
  const KL = chainId === '100' ? GNOSIS_KLEROSLIQUID : MAINNET_KLEROSLIQUID;

  useEffect(() => {
    async function fetchMetaevidence() {
      
      const response = await archon.arbitrable.getDispute(arbitrableId, KL, disputeId);

      const _metaEvidence: MetaEvidence = await archon.arbitrable.getMetaEvidence(arbitrableId, response.metaEvidenceID, {
        strict: true,
        scriptParameters: {
          disputeID: disputeId,
          arbitrableContractAddress: arbitrableId,
          arbitratorContractAddress: KL,
          arbitratorChainID: chainId,
          chainID: chainId,
          // arbitratorJsonRpcUrl: networkMap[this.state.network].WEB3_PROVIDER,
        },
      });

      setMetaEvidence(_metaEvidence);
    }
    if (arbitrableId && disputeId) {
      fetchMetaevidence()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arbitrableId, chainId, KL, disputeId])

  return metaEvidence
}
import { getArchon } from "../lib/archonClient"
import { MetaEvidence } from "../lib/types";


export const useMetaEvidence = (chainId: string = '1', arbitrableId:string, disputeId:string):Promise<MetaEvidence> => {
    const archon = getArchon(chainId);
    return archon.arbitrable.getMetaEvidence(arbitrableId, disputeId);
}
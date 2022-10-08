import { BigNumberish } from "ethers";
import { voteMapping } from "../lib/helpers";

export const useDisputeDecision = (chainId: string = '1', disputeId:BigNumberish, choice: BigNumberish, voted: boolean) => {
    // TODO: Ask the arbitrable contract to get the correct Answer
    return(voteMapping(choice, voted));
}
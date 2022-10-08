import { shortenAddress } from "@usedapp/core"

export const useArbitrableName = (chainId: string = '1', arbitrableId:string) => {
    return(
            `Arbitrable - ${shortenAddress(arbitrableId)}`
    );
}
import { shortenAddress } from "@usedapp/core"

export const useArbitrableName = (chainId: string = '1', arbitrableId:string) => {
    // TODO: Implement Kleros Curate Address Tag
    return(
            `ArbitrableName - ${shortenAddress(arbitrableId)}`
    );
}
import { COOP_MULTISIG, PNK_CONTRACT } from "../lib/helpers";
import { BigNumber, ethers } from 'ethers'
import genericErc20Abi from '../abis/ERC20.json';
import { useEffect, useState } from "react";

export function usePNKBalance(wallet:string = COOP_MULTISIG): {balance:number|undefined, totalSupply:number|undefined} {
    const [balance, setBalance] = useState<number | undefined>(undefined);
    const [totalSupply, setTotalSupply] = useState<number | undefined>(undefined);
    const provider = new ethers.providers.InfuraProvider(1, 'c9a92fe089b5466ab56a47925486d062');
    const contract = new ethers.Contract(PNK_CONTRACT, genericErc20Abi, provider);

    useEffect(() => {
        contract.balanceOf(wallet).then((balance:BigNumber) => {
          setBalance(Number(ethers.utils.formatEther(BigNumber.from(balance))))
        });
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [contract]);
    
      useEffect(() => {
        contract.totalSupply().then((totalSupply:BigNumber) => {
          setTotalSupply(Number(ethers.utils.formatEther(BigNumber.from(totalSupply))))
        });
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [wallet]);
    
    return {balance: balance, totalSupply: totalSupply}
}




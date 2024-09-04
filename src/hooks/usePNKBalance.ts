import { BigNumber, ethers } from "ethers";
import { useEffect, useMemo, useState } from "react";
import genericErc20Abi from "../abis/ERC20.json";
import { PNK_CONTRACT } from "../lib/helpers";

export function usePNKBalance(wallets: `0x${string}`[]): {
  balance: number | undefined;
  totalSupply: number | undefined;
} {
  const [balance, setBalance] = useState<number | undefined>(undefined);
  const [totalSupply, setTotalSupply] = useState<number | undefined>(undefined);
  const provider = useMemo(
    () =>
      new ethers.providers.JsonRpcProvider(
        process.env.REACT_APP_WEB3_MAINNET_PROVIDER_URL
      ),
    []
  );
  const contract = useMemo(
    () => new ethers.Contract(PNK_CONTRACT, genericErc20Abi, provider),
    [provider]
  );

  useEffect(() => {
    const balanceOfPromises = wallets.map((wallet) =>
      contract
        .balanceOf(wallet)
        .then((balance: BigNumber) => Number(ethers.utils.formatEther(balance)))
    );
    Promise.all(balanceOfPromises).then((balances) => {
      setBalance(
        balances.reduce((partialSum, balance) => partialSum + balance, 0)
      );
    });
  }, [contract, wallets]);

  useEffect(() => {
    contract.totalSupply().then((totalSupply: BigNumber) => {
      setTotalSupply(
        Number(ethers.utils.formatEther(BigNumber.from(totalSupply)))
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallets]);

  return { balance: balance, totalSupply: totalSupply };
}

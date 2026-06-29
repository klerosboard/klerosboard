import { formatEther } from 'viem';
import { useEffect, useState } from 'react';
import genericErc20Abi from '../abis/ERC20.json';
import { PNK_CONTRACT } from '../lib/helpers';
import { mainnetClient } from '../lib/viemClient';

export function usePNKBalance(wallets: `0x${string}`[]): {
  balance: number | undefined;
  totalSupply: number | undefined;
} {
  const [balance, setBalance] = useState<number | undefined>(undefined);
  const [totalSupply, setTotalSupply] = useState<number | undefined>(undefined);

  useEffect(() => {
    const balanceOfPromises = wallets.map((wallet) =>
      mainnetClient
        .readContract({
          address: PNK_CONTRACT as `0x${string}`,
          abi: genericErc20Abi as any,
          functionName: 'balanceOf',
          args: [wallet],
        })
        .then((balance: any) => Number(formatEther(balance as bigint))),
    );
    Promise.all(balanceOfPromises).then((balances) => {
      setBalance(balances.reduce((partialSum, balance) => partialSum + balance, 0));
    });
  }, [wallets]);

  useEffect(() => {
    mainnetClient
      .readContract({
        address: PNK_CONTRACT as `0x${string}`,
        abi: genericErc20Abi as any,
        functionName: 'totalSupply',
      })
      .then((totalSupply: any) => {
        setTotalSupply(Number(formatEther(totalSupply as bigint)));
      });
  }, [wallets]);

  return { balance: balance, totalSupply: totalSupply };
}

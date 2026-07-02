import { useQuery } from '@tanstack/react-query';
import { KLEROS_STATS_API } from '../lib/helpers';

export interface FeeByDispute {
  disputeId: string;
  arbitrableId: string;
  ethAmount: number;
  usdAmount: number;
  timestamp: number;
}

export const useFeesPaidByDispute = (chainId: string) => {
  return useQuery<FeeByDispute[], Error>({
    queryKey: ['feesPaidByDispute', chainId],
    queryFn: async () => {
      const url = new URL(`${KLEROS_STATS_API}fees-by-dispute`, window.location.origin);
      url.searchParams.set('chainId', chainId);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Stats API error: ${res.status}`);
      const json = await res.json();
      return json.data as FeeByDispute[];
    },
    enabled: !!chainId,
    staleTime: 5 * 60 * 1000,
  });
};

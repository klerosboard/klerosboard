import { useQuery } from '@tanstack/react-query';
import { KLEROS_STATS_API } from '../lib/helpers';
import { FeesPaid } from '../lib/types';

export const useFeesPaid = (chainId: string) => {
  return useQuery<FeesPaid>({
    queryKey: ['feesPaid', chainId],
    queryFn: async () => {
      const url = new URL(`${KLEROS_STATS_API}fees`, window.location.origin);
      url.searchParams.set('chainId', chainId);
      url.searchParams.set('freq', 'M');
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Stats API error: ${res.status}`);
      const json = await res.json();
      return json.data as FeesPaid;
    },
    enabled: !!chainId,
    staleTime: 5 * 60 * 1000,
  });
};

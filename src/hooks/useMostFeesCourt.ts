import { useQuery } from '@tanstack/react-query';
import { KLEROS_STATS_API } from '../lib/helpers';
import type { FeeByDispute } from './useFeesPaidByDispute';

interface Props {
  chainId: string;
  relTimestamp?: string | Date;
}

interface CourtIdResult {
  id: string;
}

export const useMostFeesCourt = ({ chainId, relTimestamp }: Props) => {
  const feeCutoff = relTimestamp ? new Date(relTimestamp).getTime() / 1000 : 0;

  return useQuery<CourtIdResult, Error>({
    queryKey: ['useMostFeesCourt', chainId, relTimestamp],
    enabled: !!chainId,
    queryFn: async () => {
      const url = new URL(`${KLEROS_STATS_API}fees-by-dispute`, window.location.origin);
      url.searchParams.set('chainId', chainId);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Stats API error: ${res.status}`);
      const json = await res.json();
      const feesByDispute = json.data as FeeByDispute[];
      if (!feesByDispute || feesByDispute.length === 0) throw new Error('No fee data available');

      // Filter to time window and exclude disputes without a court link
      const filtered =
        feeCutoff > 0
          ? feesByDispute.filter((f) => f.timestamp >= feeCutoff && f.courtId !== '0')
          : feesByDispute.filter((f) => f.courtId !== '0');

      if (filtered.length === 0) throw new Error('No fees in period');

      // Group by courtId and sum ethAmount
      const feeByCourt = new Map<string, number>();
      for (const fee of filtered) {
        feeByCourt.set(fee.courtId, (feeByCourt.get(fee.courtId) ?? 0) + fee.ethAmount);
      }

      // Find court with max fees
      let maxCourtId = '';
      let maxFees = -Infinity;
      for (const [courtId, total] of feeByCourt) {
        if (total > maxFees) {
          maxFees = total;
          maxCourtId = courtId;
        }
      }

      return { id: maxCourtId };
    },
    staleTime: 5 * 60 * 1000,
  });
};

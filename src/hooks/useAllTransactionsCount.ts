import { useQuery } from "@tanstack/react-query";
import { KLEROS_STATS_API } from "../lib/helpers";
import { TimestampCounter } from "../lib/types";

export const useAllTransactionsCount = (chainId: string) => {
  return useQuery<TimestampCounter>({
    queryKey: ["allTransactionsCount", chainId],
    queryFn: async () => {
      const url = new URL(`${KLEROS_STATS_API}transactions`, window.location.origin);
      url.searchParams.set("chainId", chainId);
      url.searchParams.set("freq", "M");
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Stats API error: ${res.status}`);
      const json = await res.json();
      // La función devuelve { tx: TimestampCounter } — extraer .tx
      return (json.data as { tx: TimestampCounter }).tx;
    },
    enabled: !!chainId,
    staleTime: 5 * 60 * 1000,
  });
};
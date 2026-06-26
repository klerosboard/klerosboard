import { useQuery } from "@tanstack/react-query";
import { KLEROS_STATS_API } from "../lib/helpers";
import { PNKStakedSerie } from "../lib/types";

export const usePNKStaked = (chainId: string) => {
  return useQuery<PNKStakedSerie>({
    queryKey: ["pnkStaked", chainId],
    queryFn: async () => {
      const url = new URL(`${KLEROS_STATS_API}staked-percentage`, window.location.origin);
      url.searchParams.set("chainId", chainId);
      url.searchParams.set("freq", "M");
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Stats API error: ${res.status}`);
      const json = await res.json();
      return json.data as PNKStakedSerie;
    },
    enabled: !!chainId,
    staleTime: 5 * 60 * 1000,
  });
};
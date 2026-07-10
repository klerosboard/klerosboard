import { useEffect, useState } from 'react';
import { getCourtName } from '../lib/helpers';

/**
 * Fetches human-readable names for a list of court IDs.
 * Returns a Map<courtId, name>.
 */
export function useCourtNames(chainId: string, courtIds: string[]) {
  const [names, setNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!chainId || courtIds.length === 0) return;

    let cancelled = false;

    const fetchNames = async () => {
      const entries = await Promise.all(
        courtIds.map(async (id) => [id, await getCourtName(chainId, id)] as [string, string]),
      );
      if (!cancelled) {
        setNames(new Map(entries));
      }
    };

    fetchNames();

    return () => {
      cancelled = true;
    };
  }, [chainId, courtIds.join(',')]);

  return names;
}

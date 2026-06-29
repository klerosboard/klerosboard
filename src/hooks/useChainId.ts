import { useLocation } from 'react-router-dom';

const CHAIN_ID_REGEX = /(11155111|42161|100|1)(?:\/|$)/;

export function useChainId(defaultChainId = '1'): string {
  const location = useLocation();
  const match = location.pathname.match(CHAIN_ID_REGEX);
  return match ? match[1] : defaultChainId;
}

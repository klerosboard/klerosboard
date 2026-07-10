import { createPublicClient, fallback, http } from 'viem';
import { mainnet, gnosis, sepolia, arbitrum } from 'viem/chains';

const MAINNET_RPC_URLS = [
  import.meta.env.VITE_WEB3_MAINNET_PROVIDER_URL,
  'https://eth.llamarpc.com',
  'https://ethereum.publicnode.com',
  'https://eth.drpc.org',
].filter(Boolean) as string[];

export const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: fallback(MAINNET_RPC_URLS.map((url) => http(url))),
});

export const gnosisClient = createPublicClient({
  chain: gnosis,
  transport: http(import.meta.env.VITE_WEB3_GNOSIS_PROVIDER_URL),
});

export const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(), // fallback public RPC
});

export const arbitrumClient = createPublicClient({
  chain: arbitrum,
  transport: http(import.meta.env.VITE_WEB3_ARBITRUM_PROVIDER_URL),
});

export function getPublicClient(chainId: string | number) {
  const chainIdStr = String(chainId);
  if (chainIdStr === '100') return gnosisClient;
  if (chainIdStr === '11155111') return sepoliaClient;
  if (chainIdStr === '42161') return arbitrumClient;
  return mainnetClient;
}

import { createPublicClient, http } from 'viem'
import { mainnet, gnosis, sepolia } from 'viem/chains'

export const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(import.meta.env.VITE_WEB3_MAINNET_PROVIDER_URL),
})

export const gnosisClient = createPublicClient({
  chain: gnosis,
  transport: http(import.meta.env.VITE_WEB3_GNOSIS_PROVIDER_URL),
})

export const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(), // fallback public RPC
})

export function getPublicClient(chainId: string | number) {
  const chainIdStr = String(chainId)
  if (chainIdStr === '100') return gnosisClient
  if (chainIdStr === '11155111') return sepoliaClient
  return mainnetClient
}

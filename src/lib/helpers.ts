import { compareAsc, Duration, format, formatDuration, fromUnixTime, intervalToDuration } from 'date-fns';
import { enGB, es } from 'date-fns/locale';
import { DecimalBigNumber } from './DecimalBigNumber';
import { BigNumberish } from './types';

import { formatUnits } from 'viem';
import { Court, KlerosCounter, LItem } from '../graphql/subgraph';
import { apolloClientQuery } from './apolloClient';
import { I18nContextProps } from './types';
import { getPublicClient } from './viemClient';
import { toIpfsGatewayUrl } from './ipfs';

const dateLocales = {
  es,
  en: enGB,
};

// const chains = {
//   mainnet: '1',
//   gnosis: '100'
// }

export const KLEROS_STATS_API = import.meta.env.VITE_STATS_API_URL ?? '/.netlify/functions/stats-';

export const MAINNET_KLEROSLIQUID = '0x988b3A538b618C7A603e1c11Ab82Cd16dbE28069';
export const GNOSIS_KLEROSLIQUID = '0x9C1dA9A04925bDfDedf0f6421bC7EEa8305F9002';
export const PNK_CONTRACT = '0x93ED3FBe21207Ec2E8f2d3c3de6e058Cb73Bc04d';
export const COOP_MULTISIGS: `0x${string}`[] = [
  '0xe979438b331b28d3246f8444b74cab0f874b40e8',
  '0xb2a33ae0e07fd2ca8dbde9545f6ce0b3234dc4e8',
  '0xf1468dbe2d6155aaf52f57879a1f3b307243e4a7',
  '0xdc657fac185d00cdfa34a8378bb87d586bf998f7',
  '0x9ad3d4b34315b1d9f9026e66d6da0c6581690e88',
];
// Scout Address Tags registry (Gnosis Chain). Canonical source for address names.
// Items use CAIP-10 format in key0: "eip155:{chainId}:{address}", name in key1.
export const ADDRESS_TAG_REGISTRY = '0x66260C69d03837016d88c9877e61e08Ef74C59F2';

/**
 * Build the Scout CAIP-10 address key: eip155:{chainId}:{address}
 */
export const buildScoutAddressKey = (chainId: string, address: string): string =>
  `eip155:${chainId}:${address.toLowerCase()}`;

/**
 * Find the Curate LItem name for an arbitrable on a specific chain.
 * Scout format: key0 = "eip155:{chainId}:{address}", key1 = name.
 */
export function findArbitrableName(arbitrable: string, chainId: string, arbitrableNames: LItem[]): string | undefined {
  const key = buildScoutAddressKey(chainId, arbitrable);
  const foundItem = arbitrableNames.find((item) => item.key0?.toLowerCase() === key);
  return foundItem?.key1;
}

export function getRPCURL(chainId: string | number): string {
  if (chainId === '100' || chainId === 100) return import.meta.env.VITE_WEB3_GNOSIS_PROVIDER_URL!;
  if (chainId === '137' || chainId === 137) return import.meta.env.VITE_WEB3_POLYGON_PROVIDER_URL!;
  if (chainId === '42161' || chainId === 42161)
    return import.meta.env.VITE_WEB3_ARBITRUM_PROVIDER_URL || 'https://arb1.arbitrum.io/rpc';
  return import.meta.env.VITE_WEB3_MAINNET_PROVIDER_URL!;
}

export function getChainId(searchParams: URLSearchParams): string {
  const chain = searchParams.get('chainId');
  if (chain === '100') return '100';
  if (chain === '42161') return '42161';
  return '1';
}

export function getBlockExplorer(chainId: string): string {
  if (chainId === '100') return 'https://gnosisscan.io';
  if (chainId === '42161') return 'https://arbiscan.io';
  return 'https://etherscan.io';
}

export function getPeriodNumber(period: string): number {
  if (period === 'evidence') return 0;
  if (period === 'commit') return 1;
  if (period === 'vote') return 2;
  if (period === 'appeal') return 3;
  return 4;
}

export function formatDate(timestamp: number, formatString: string = 'MMMM d yyyy, HH:mm') {
  const date = fromUnixTime(timestamp);
  return format(date, formatString);
}

export function getTimeLeft(
  endDate: Date | string | number,
  withSeconds = false,
  locale: I18nContextProps['locale'],
): string | false {
  const startDate = new Date();

  if (typeof endDate === 'number' || typeof endDate === 'string') {
    endDate = fromUnixTime(Number(endDate));
  }

  if (compareAsc(startDate, endDate) === 1) {
    return false;
  }

  const duration = intervalToDuration({ start: startDate, end: endDate });

  const format: (keyof Duration)[] = ['years', 'months', 'weeks', 'days', 'hours'];

  if (withSeconds) {
    format.push('minutes', 'seconds');
  } else if (Number(duration.days) < 1) {
    format.push('minutes');
  }

  return formatDuration(duration, { format, locale: dateLocales[locale] });
}

export function getCurrency(chainId: string): string {
  if (chainId === '100') return 'xDAI';
  if (chainId === '42161') return 'ETH';
  return 'ETH';
}

export function format18DecimalNumber(value: BigNumberish): DecimalBigNumber {
  if (value === undefined || value === null) return new DecimalBigNumber(BigInt(0), 18);
  return new DecimalBigNumber(BigInt(String(value)), 18);
}

export function formatPNK(amount: BigNumberish | undefined, format?: boolean, currency?: boolean): string {
  if (amount == null) return 'N/A';
  if (typeof format === 'undefined') format = true;
  const number = format18DecimalNumber(amount);
  return number.toString({ decimals: 0, format: format }) + `${currency ? ' PNK' : ''}`;
}

export function formatAmount(
  amount: BigNumberish | undefined,
  chainId: string = '1',
  format?: boolean,
  currency?: boolean,
  decimals: number = 4,
): string {
  if (typeof format === 'undefined') format = false;

  if (amount === undefined || amount === null) return 'N/A';
  const number = new DecimalBigNumber(BigInt(String(amount)), 18);
  return `${number.toString({ decimals: decimals, format: format })} ${currency ? getCurrency(chainId) : ''}`;
}

export function showWalletError(error: unknown) {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const errObj = error as { message?: string };
    if (typeof errObj.message === 'string') {
      if (errObj.message.startsWith('{')) {
        try {
          const _error = JSON.parse(errObj.message);
          if (typeof _error === 'object' && _error !== null && 'message' in _error) {
            return (_error as { message?: string }).message;
          }
        } catch (_: unknown) {
          // Silently fail if JSON parse fails
        }
      } else {
        return errObj.message;
      }
    }
  }
}

const getCourtNameV1 = async (chainid: string, id: string) => {
  const query = `
  query CourtsPolicyQuery($id: String) {
      court(id: $id) {
          policy{policy}
      }
  }
`;

  const response = await apolloClientQuery<{ court: Court }>(chainid, query, {
    id,
  });

  if (!response) throw new Error('No response from TheGraph');

  if (response.data!.court === null || response.data!.court.policy === null) return 'Unknown';

  // Handle both v1 schema (policy.policy = string path) and v2 schema (policy = URI string)
  const policyPath =
    typeof response.data!.court.policy === 'string'
      ? response.data!.court.policy
      : (response.data!.court.policy as unknown as { policy?: string }).policy;

  if (!policyPath) return 'Unknown';

  const url = toIpfsGatewayUrl(policyPath);
  if (!url) return 'Unknown';
  const r = await fetch(url);
  if (!r.ok) return 'Unknown';
  const courtName = await r.json();
  return courtName.name;
};

const getCourtNameV2 = async (id: string) => {
  const query = `
  query CourtData($id: String) {
      court(id: $id) {
          name
      }
  }
`;

  const response = await apolloClientQuery<{ court: Court }>('42161', query, {
    id,
  });

  if (!response || !response.data) throw new Error('No response from TheGraph');

  if (response.data!.court === null || response.data!.court.name === null) return 'Unknown';
  return response.data.court.name;
};

export const getCourtName = async (chainId: string, id: string) => {
  if (chainId === '42161') return getCourtNameV2(id);
  else return getCourtNameV1(chainId, id);
};

export function voteMapping(
  choice: BigNumberish | undefined,
  voted: boolean,
  commit: string | undefined,
  titles: string[] | undefined,
): string {
  const choiceNumber = Number(choice);
  if ((!voted || !choice) && !commit) return 'Pending';
  if (commit && !choice) return 'Committed';
  if (choiceNumber === 0) return 'Refuse to Arbitrate';
  if (!titles || choiceNumber > titles.length) return `Option ${choiceNumber}`;
  return titles[choiceNumber - 1];
}

export function getVoteStake(minStake: BigNumberish, alpha: BigNumberish): number {
  return (Number(formatUnits(BigInt(String(minStake)), 18)) * Number(alpha)) / 10000;
}

export function computeCoherency(totalCoherentVotes: number | bigint, totalResolvedVotes: number | bigint): number {
  const coherent = Number(totalCoherentVotes);
  const resolved = Number(totalResolvedVotes);
  return resolved > 0 ? Math.round((coherent / resolved) * 100) : 0;
}

export async function getBlockByDate(
  timestamp: string | Date,
  chainId: string,
): Promise<{ block: number; timestamp: number }> {
  const client = getPublicClient(chainId);
  const targetTime = BigInt(Math.floor(new Date(timestamp).getTime() / 1000));

  // Arbitrum produces ~4 blocks/second — binary search over millions of blocks
  // would require 20+ sequential RPC calls. Instead, estimate directly.
  if (chainId === '42161') {
    const ARBITRUM_BLOCK_TIME = 0.25; // seconds per block (approx)
    const latestBlock = await client.getBlock({ blockTag: 'latest' });
    const secondsDiff = Number(latestBlock.timestamp) - Number(targetTime);
    const estimatedBlocksBack = Math.round(secondsDiff / ARBITRUM_BLOCK_TIME);
    const estimatedBlock = latestBlock.number - BigInt(estimatedBlocksBack);
    const safeBlock = estimatedBlock > 0n ? estimatedBlock : 1n;

    const block = await client.getBlock({ blockNumber: safeBlock });
    return { block: Number(safeBlock), timestamp: Number(block?.timestamp ?? targetTime) };
  }

  const TOLERANCE = 60n; // seconds tolerance
  let lo = 0n;
  let hi = await client.getBlockNumber();

  while (lo < hi) {
    const mid = (lo + hi) / 2n;
    const block = await client.getBlock({ blockNumber: mid });

    if (!block) {
      hi = mid - 1n;
      continue;
    }

    if (block.timestamp < targetTime - TOLERANCE) {
      lo = mid + 1n;
    } else if (block.timestamp > targetTime + TOLERANCE) {
      hi = mid - 1n;
    } else {
      return { block: Number(mid), timestamp: Number(block.timestamp) };
    }
  }

  // Return the block at lo position
  const finalBlock = await client.getBlock({ blockNumber: lo });
  return {
    block: Number(lo),
    timestamp: finalBlock ? Number(finalBlock.timestamp) : Number(targetTime),
  };
}

export function getPercentageStaked(kc: KlerosCounter, totalSupply: string | number): string {
  const tokenStaked = Number(new DecimalBigNumber(BigInt(String(kc.tokenStaked)), 18));
  return ((tokenStaked / Number(totalSupply)) * 100).toFixed(2);
}

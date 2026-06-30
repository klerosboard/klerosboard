import { compareAsc, Duration, format, formatDuration, fromUnixTime, intervalToDuration } from 'date-fns';
import { enGB, es } from 'date-fns/locale';
import { DecimalBigNumber } from './DecimalBigNumber';
import { BigNumberish } from './types';

import { formatUnits } from 'viem';
import { Court, KlerosCounter } from '../graphql/subgraph';
import { apolloClientQuery } from './apolloClient';
import { I18nContextProps } from './types';
import { getPublicClient } from './viemClient';

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
export const ADDRESS_TAG_REGISTRY_GNOSIS = '0x76944a2678A0954A610096Ee78E8CEB8d46d5922';
export const ADDRESS_TAG_REGISTRY_MAINNET = '0x6e31d83b0c696f7d57241d3dffd0f2b628d14c67';

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

export function formatPNK(amount: BigNumberish, format?: boolean, currency?: boolean): string {
  if (typeof format === 'undefined') format = true;
  const number = format18DecimalNumber(amount);
  return number.toString({ decimals: 0, format: format }) + `${currency ? ' PNK' : ''}`;
}

export function formatAmount(
  amount: BigNumberish,
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

  const url = 'https://cdn.kleros.link' + policyPath;
  const r = await fetch(url);
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

export const arbitrableWhitelist: Record<number, string[]> = {
  1: [
    // Curate / TCR
    '0x126697b552b83f08c7ebebae8d13eae2871e4e1e',
    '0x250aa88c8f54f5e70b94214380342f0d53e42f6c',
    '0x2e3b10abf091cdc53cc892a50dabdb432e220398',
    '0x327a29fce0a6490e4236240be176daa282eccfdf',
    '0x46580533db92c418a79f91b46df70283daef7f99',
    '0x594ec762b59978c97c82bc36ab493ed8b1f1f368',
    '0x6341ec8f3f23689bd6ea3cf82fe34c3a0481c30a',
    '0x68c4cc21378301cfdd5702d66d58a036d7bafe28',
    '0x701cabaf65ed3974925fb94988842a29d2ce7aa3',
    '0x799cb978dea5d6ca00ccb1794d3c3d4c89e40cd1',
    '0x7ecffaa0247227a29d613adb3b1b47e44f0f53cb',
    '0x916deab80dfbc7030277047cd18b233b3ce5b4ab',
    '0xa3e4348bddc32afcedc5e088e0e21fd6154a0180',
    '0xab0d90943a58b1a64c0171ee8e743d9998be6ac3',
    '0xc5e9ddebb09cd64dfacab4011a0d5cedaf7c9bdb',
    '0xc9a3cd210cc9c11982c3acf7b7bf9b1083242cb6',
    '0xcb4aae35333193232421e86cd2e9b6c91f3b125f',
    '0xd7e143715a4244634d74201959372e81a3623a2a',
    '0xd8bf5114796ed28aa52cff61e1b9ef4ec1f69a54',
    '0xe0e1bc8c6cd1b81993e2fcfb80832d814886ea38',
    '0xe5bcea6f87aaee4a81f64dfdb4d30d400e0e5cf4',
    '0xebcf3bca271b26ae4b162ba560e243055af0e679',
    '0xf339047c85d0dd2645f2bd802a1e8a5e7af61053',
    '0xf65c7560d6ce320cc3a16a07f1f65aab66396b9e',
    '0xbe9834097a4e97689d9b667441acafb456d0480a', // PoH V2
    // Reality.eth mainnet proxies
    '0xce9b84c5612beaa234ad0d9fa7d283293479510e', // WeTrust
    '0xd47f72a2d1d0e91b0ec5e5f5d02b2dc26d00a14d', // Ethereum main (old)
    '0x728cba71a3723caab33ea416cb46e2cc9215a596', // Ethereum main (deprecated)
    '0xff32eff53459485074b4db14633252c9dca3791a', // Ethereum main (new)
    '0xf72cfd1b34a91a64f9a98537fe63fbab7530adca', // Ethereum DAO Governance
    '0x2018038203aee8e7a29dabd73771b0355d4f85ad', // Ethereum Seer
    '0xc45d8d9b2b6843528a4dc2d8b5858e5c258d2992', // Ethereum Seer new (idle)
    '0x1c2811550551d84030cd1b608e6fe3fd6fd5fc0d', // Lockler
    '0x776e5853e3d61b2dfb22bcf872a43bf9a1231e52', // Polygon-Ethereum Foreign Proxy
    '0x2f0895732bfacdcf2fdb19962fe609d0da695f21', // Gnosis-Ethereum main Foreign Proxy (deprecated)
    '0xfe0eb5fc686f929eb26d541d75bb59f816c0aa68', // Gnosis-Ethereum Seer Foreign Proxy
  ],
  100: [
    // Curate / TCR
    '0x0b928165a67df8254412483ae8c3b8cc7f2b4d36',
    '0x1d48a279966f37385b4ab963530c6dc813b3a8df',
    '0x2a2bab2c2d4eb5007b0389720b287d4d19dc4001',
    '0x2b6869e4f1d6104989f15da7454dbf7a01310bb8',
    '0x2e39b8f43d0870ba896f516f78f57cde773cf805',
    '0x2f19f817bbf800b487b7f2e51f24ad5ea0222463',
    '0x464c84c41f3c25ba5a75b006d8b20600a8777306',
    '0x54068a67441a950ff33afa5a3247acc7188d0789',
    '0x54a92c21c6553a8085066311f2c8d9db1b5e6610',
    '0x66260c69d03837016d88c9877e61e08ef74c59f2',
    '0x70533554fe5c17caf77fe530f77eab933b92af60',
    '0x76944a2678a0954a610096ee78e8ceb8d46d5922',
    '0x86e72802d9abbf7505a889721fd4d6947b02320e',
    '0x957a53a994860be4750810131d9c876b2f52d6e1',
    '0xa2bfff0553de7405781fe0c39c04a383f04b9c80',
    '0xa78ec5742a5d360f92f6d6d7e775fb35ab559a51',
    '0xaeecfa44639b61d2e0a9534d918789d94a24a9de',
    '0xd5994f15be9987104d9821aa99d1c97227c7c08c',
    '0xe04f5791d671d5c4e08ab49b39807087b591ea3e',
    '0xf7de5537ecd69a94695fcf4bcdbdee6329b63322',
    '0xee1502e29795ef6c2d60f8d7120596abe3bad990',
    '0x9fe4d9e4989ad031fdc424d8c34d77e70aa0b269',
    '0xa4ac94c4fa65bb352efa30e3408e64f72ac857bc', // PoH V2
    '0x5aaf9e23a11440f8c1ad6d2e2e5109c7e52cc672', // Seer Market registry on Curate
    // Reality.eth Gnosis proxies
    '0x5afa42b30955f137e10f89dfb5ef1542a186f90e', // Gnosis-Ethereum Polkamarkets Foreland Home Proxy
    '0x8453ba2c9ea5bae36fde6cbd61c12c05b6552425', // Gnosis-Ethereum Polkamarkets Foreland Foreign Proxy
    '0x68154ea682f95bf582b80dd6453fa401737491dc', // Gnosis-Ethereum Seer Home Proxy
    '0xfe0eb5fc686f929eb26d541d75bb59f816c0aa68', // Gnosis-Ethereum Seer Foreign Proxy
    '0x5562ac605764dc4039fb6ab56a74f7321396cdf2', // Gnosis-Ethereum Omen AI with appeals Home Proxy
    '0xef2ae6961ec7f2105bc2693bc32fa7b7386b2f59', // Gnosis-Ethereum Omen AI with appeals Foreign Proxy
    '0x88fb25d399310c07d35cb9091b8346d8b1893aa5', // Gnosis-Ethereum RealitioHomeArbitrationProxy
    '0x32bdc9776692679cfbbf8350bad67da13faaa3f', // Gnosis-Ethereum RealitioForeignArbitrationProxyWithAppeals
  ],
};

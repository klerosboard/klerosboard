import { formatEther } from 'viem';
import { BigNumberish } from './types';

// Published by kleros/court: the monthly reward snapshot CIDs, keyed by chain id.
const SNAPSHOTS_URL = 'https://court.kleros.io/snapshots.json';
const IPFS_CDN_BASE = 'https://cdn.kleros.link/ipfs';

type SnapshotsByChainId = Record<'1' | '100', string[]>;

const klerosboardSubgraph = {
  1: 'https://api.studio.thegraph.com/query/66145/klerosboard-mainnet/version/latest',
  100: 'https://api.studio.thegraph.com/query/66145/klerosboard-gnosis/version/latest',
};

// Percentage [0-1] of the rewards per chain
const REWARDS_PER_CHAIN: Record<string, number> = {
  '1': 0.9,
  '100': 0.1,
  '42161': 0,
  '11155111': 0,
};

function getTarget() {
  let months;
  const start = new Date(2025, 8, 1); // When KIP-78 started (September 2025)
  const initialTarget = 0.33; // initial staking target for KIP-78
  const now = new Date();
  // add 0.2% per month since start date of kip78 with max 50%
  months = (now.getFullYear() - start.getFullYear()) * 12;
  months -= start.getMonth();
  months += now.getMonth();
  months = months <= 0 ? 0 : months;
  const target = initialTarget + months * 0.002;
  return target > 0.5 ? 0.5 : target;
}

function getPreviousMonthAndYear(date = new Date()) {
  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();
  let month, year;
  // month starts with 0
  if (currentMonth === 0) {
    // month is 12 and the previous year
    month = 12;
    year = currentYear - 1;
  } else {
    // no need to do month -1 because starts in zero.
    month = currentMonth;
    year = currentYear;
  }
  return {
    month: month < 10 ? `0${month}` : month.toString(),
    year: year.toString(),
  };
}

let snapshotsPromise: Promise<SnapshotsByChainId> | undefined;

// court.kleros.io answers unknown paths with index.html and a 200, so the shape of the body —
// not response.ok — is what tells us we really got the manifest.
async function fetchSnapshots(): Promise<SnapshotsByChainId> {
  if (!snapshotsPromise) {
    snapshotsPromise = (async () => {
      const response = await fetch(SNAPSHOTS_URL);
      const snapshots = await response.json();
      if (!Array.isArray(snapshots?.['1']) || !Array.isArray(snapshots?.['100'])) {
        throw new Error(`${SNAPSHOTS_URL} did not return a snapshot manifest`);
      }
      return snapshots as SnapshotsByChainId;
    })().catch((error) => {
      snapshotsPromise = undefined; // don't cache a failure, let the next caller retry
      throw error;
    });
  }
  return snapshotsPromise;
}

// Entries look like "<cid>/snapshot-2026-06.json" or "<cid>/xdai-snapshot-2026-06.json".
// The leading slash matters: without it "xdai-snapshot-..." also matches the mainnet name.
function snapshotUrlsForMonth(snapshots: SnapshotsByChainId, year: string, month: string) {
  const filenames = [`snapshot-${year}-${month}.json`, `xdai-snapshot-${year}-${month}.json`];
  return [...snapshots['1'], ...snapshots['100']]
    .filter((path) => filenames.some((filename) => path.endsWith(`/${filename}`)))
    .map((path) => ({
      url: `${IPFS_CDN_BASE}/${path}`,
      isGnosis: path.includes('/xdai-snapshot-'),
    }));
}

async function getLatestSnapshotUrls() {
  const snapshots = await fetchSnapshots();
  const { month, year } = getPreviousMonthAndYear();
  const urls = snapshotUrlsForMonth(snapshots, year, month);
  if (urls.length > 0) return urls;
  // Last month's snapshot may not be published yet, so fall back to the month before.
  const { month: prevMonth, year: prevYear } = getPreviousMonthAndYear(new Date(Number(year), Number(month) - 1, 1));
  return snapshotUrlsForMonth(snapshots, prevYear, prevMonth);
}

async function fetchSubgraphStaked(subgraphUrl: string) {
  const response = await fetch(subgraphUrl, {
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `{
        klerosCounters {
          tokenStaked
        }
      }`,
    }),
    method: 'POST',
    mode: 'cors',
  });
  const data = await response.json();
  if (data?.data?.klerosCounters?.[0]?.tokenStaked) {
    return Number(formatEther(BigInt(data.data.klerosCounters[0].tokenStaked)));
  }
  throw new Error('Subgraph returned no data');
}

async function fetchSnapshotStaked(snapshotUrl: string) {
  const response = await fetch(snapshotUrl);
  const snapshot = await response.json();
  if (snapshot?.averageTotalStaked?.hex) {
    const hexValue = snapshot.averageTotalStaked.hex.startsWith('0x')
      ? snapshot.averageTotalStaked.hex
      : '0x' + snapshot.averageTotalStaked.hex;
    return Number(formatEther(BigInt(hexValue)));
  }
  throw new Error('Snapshot missing averageTotalStaked');
}

async function getTotalStakedAllChains() {
  let mainnetStaked = 0;
  let gnosisStaked = 0;

  // Try mainnet subgraph first, fallback to snapshot
  try {
    mainnetStaked = await fetchSubgraphStaked(klerosboardSubgraph[1]);
  } catch (_) {
    try {
      const snapshotUrls = await getLatestSnapshotUrls();
      const mainnetSnapshotUrl = snapshotUrls.find((s) => !s.isGnosis)?.url;
      if (mainnetSnapshotUrl) {
        mainnetStaked = await fetchSnapshotStaked(mainnetSnapshotUrl);
      }
    } catch (snapshotError) {
      console.error('Failed to fetch mainnet staked amount:', snapshotError);
    }
  }

  // Try gnosis subgraph first, fallback to snapshot
  try {
    gnosisStaked = await fetchSubgraphStaked(klerosboardSubgraph[100]);
  } catch (_) {
    try {
      const snapshotUrls = await getLatestSnapshotUrls();
      const gnosisSnapshotUrl = snapshotUrls.find((s) => s.isGnosis)?.url;
      if (gnosisSnapshotUrl) {
        gnosisStaked = await fetchSnapshotStaked(gnosisSnapshotUrl);
      }
    } catch (snapshotError) {
      console.error('Failed to fetch gnosis staked amount:', snapshotError);
    }
  }

  return mainnetStaked + gnosisStaked;
}

export async function getLastMonthReward() {
  const urls = await getLatestSnapshotUrls();
  let lastMonthReward = 0n;
  // read the reward from the ipfs file and add it.
  for (const { url } of urls) {
    const res = await fetch(url);
    const json = await res.json();
    const hexValue = json.totalClaimable.hex.startsWith('0x')
      ? json.totalClaimable.hex
      : '0x' + json.totalClaimable.hex;
    lastMonthReward += BigInt(hexValue);
  }
  return Number(formatEther(lastMonthReward));
}

export async function getStakingReward(chainId: string, totalStaked: BigNumberish, totalSupply: number) {
  console.log(`Getting rewards from chain ${chainId}. Total Staked ${totalStaked}`);
  if (!totalStaked) return 0;

  const chainRewardPercentage = REWARDS_PER_CHAIN[chainId]!; // Reward splitted by chain
  console.log(chainRewardPercentage);
  if (!chainRewardPercentage || chainRewardPercentage === 0) return 0;
  const lastMonthReward = await getLastMonthReward();
  const target = getTarget();
  const totalStakedAllChains = await getTotalStakedAllChains();
  // Calculate global staking rate (used for reward multiplier)
  const currentStakedRate = totalStakedAllChains / totalSupply;

  // Apply KIP-78 formula: chainReward = chainPercentage * lastReward * (1 + target - stakedRate)
  const chainReward = chainRewardPercentage * lastMonthReward * (1 + target - currentStakedRate);
  const totalStakedInEther = Number(formatEther(BigInt(String(totalStaked))));
  // Calculate APY for this specific chain
  const apy = (Number(chainReward) / Number(totalStakedInEther)) * 12 * 100;

  return apy;
}

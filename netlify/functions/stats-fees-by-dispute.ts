import { Handler } from '@netlify/functions';
import { getSubgraphEndpoint, querySubgraph } from './_shared/subgraph-client';
import { getEthPriceAtMonthForChain } from './_shared/price-client';
import { ChainId } from './_shared/types';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=86400, max-age=3600',
};

interface FeesByDisputeItem {
  disputeId: string;
  arbitrableId: string;
  ethAmount: number;
  usdAmount: number;
  timestamp: number;
}

/**
 * v1 (Ethereum, Gnosis): fees live in Dispute.TokenAndETHShifts[].
 * We paginate all disputes, sum ETHAmount > 0 per dispute, and keep the
 * earliest shift timestamp as the dispute fee timestamp.
 */
async function fetchFeesByDisputeV1(chainId: '1' | '100'): Promise<FeesByDisputeItem[]> {
  const subgraphEndpoint = getSubgraphEndpoint(chainId);
  const result: FeesByDisputeItem[] = [];
  let lastId = '';

  while (true) {
    const query = `
      query DisputesWithFees($first: Int, $id_gt: ID) {
        disputes(
          first: $first
          where: { id_gt: $id_gt }
          orderBy: id
          orderDirection: asc
        ) {
          id
          arbitrable { id }
          TokenAndETHShifts(where: { ETHAmount_gt: "0" }) {
            ETHAmount
            timestamp
          }
        }
      }
    `;

    const data = await querySubgraph<{
      disputes: Array<{
        id: string;
        arbitrable: { id: string };
        TokenAndETHShifts: Array<{ ETHAmount: string; timestamp: string }>;
      }>;
    }>(subgraphEndpoint, query, { first: 1000, id_gt: lastId });

    const disputes = data.disputes ?? [];
    for (const dispute of disputes) {
      const shifts = dispute.TokenAndETHShifts;
      if (shifts.length === 0) continue;

      let totalWei = 0n;
      let minTimestamp = Number.MAX_SAFE_INTEGER;
      for (const shift of shifts) {
        totalWei += BigInt(shift.ETHAmount);
        const ts = Number(shift.timestamp);
        if (ts < minTimestamp) minTimestamp = ts;
      }

      const ethAmount = Number(totalWei) / 1e18;
      const date = new Date(minTimestamp * 1000);
      const ethPrice = await getEthPriceAtMonthForChain(date.getUTCFullYear(), date.getUTCMonth(), chainId);

      result.push({
        disputeId: dispute.id,
        arbitrableId: dispute.arbitrable.id,
        ethAmount,
        usdAmount: ethAmount * ethPrice,
        timestamp: minTimestamp,
      });
    }

    if (disputes.length < 1000) break;
    lastId = disputes[disputes.length - 1].id;
  }

  return result;
}

/**
 * v2 (Arbitrum): fees live in Dispute.rounds[].totalFeesForJurors.
 * We paginate all disputes and sum fees per dispute. createdAt is used as
 * the dispute timestamp.
 */
async function fetchFeesByDisputeV2(): Promise<FeesByDisputeItem[]> {
  const subgraphEndpoint = getSubgraphEndpoint('42161');
  const result: FeesByDisputeItem[] = [];
  let lastId = '';

  while (true) {
    const query = `
      query DisputesWithFeesV2($first: Int, $id_gt: ID) {
        disputes(
          first: $first
          where: { id_gt: $id_gt }
          orderBy: id
          orderDirection: asc
        ) {
          id
          arbitrated { id }
          createdAt
          rounds {
            totalFeesForJurors
          }
        }
      }
    `;

    const data = await querySubgraph<{
      disputes: Array<{
        id: string;
        arbitrated: { id: string };
        createdAt?: string | null;
        rounds: Array<{ totalFeesForJurors: string }>;
      }>;
    }>(subgraphEndpoint, query, { first: 1000, id_gt: lastId });

    const disputes = data.disputes ?? [];
    for (const dispute of disputes) {
      if (!dispute.rounds || dispute.rounds.length === 0) continue;

      let totalWei = 0n;
      for (const round of dispute.rounds) {
        totalWei += BigInt(round.totalFeesForJurors);
      }
      if (totalWei === 0n) continue;

      const timestamp = dispute.createdAt ? Number(dispute.createdAt) : 0;
      const ethAmount = Number(totalWei) / 1e18;
      let usdAmount = 0;
      if (timestamp > 0) {
        const date = new Date(timestamp * 1000);
        const ethPrice = await getEthPriceAtMonthForChain(date.getUTCFullYear(), date.getUTCMonth(), '42161');
        usdAmount = ethAmount * ethPrice;
      }

      result.push({
        disputeId: dispute.id,
        arbitrableId: dispute.arbitrated.id,
        ethAmount,
        usdAmount,
        timestamp,
      });
    }

    if (disputes.length < 1000) break;
    lastId = disputes[disputes.length - 1].id;
  }

  return result;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS };
  }

  const chainId = event.queryStringParameters?.chainId as ChainId | undefined;

  if (!chainId || !['1', '100', '42161'].includes(chainId)) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Invalid or missing chainId. Supported: 1, 100, 42161',
      }),
    };
  }

  try {
    const resultData = chainId === '42161' ? await fetchFeesByDisputeV2() : await fetchFeesByDisputeV1(chainId);

    return {
      statusCode: 200,
      headers: { ...JSON_HEADERS, ...CORS_HEADERS, ...CACHE_HEADERS },
      body: JSON.stringify({ data: resultData }),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      statusCode: 503,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: `Failed to fetch fees by dispute: ${message}`,
      }),
    };
  }
};

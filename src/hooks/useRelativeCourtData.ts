import { Court, COURT_FIELDS } from '../graphql/subgraph';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../lib/apolloClient';
import { getBlockByDate } from '../lib/helpers';
import { BigNumberish } from '../lib/types';

const relQuery = `
    ${COURT_FIELDS}
    query court($blockNumber:Int!, $courtId:String!) {
        court(id: $courtId, block:{number:$blockNumber}) {
        ...CourtFields
      }
    }
`;

const query = `
    ${COURT_FIELDS}
    query relCourt($courtId:String!) {
      court(id: $courtId) {
        ...CourtFields
      }
    }
`;

// v2: uses CourtCounter snapshots instead of block-based queries
const COURT_COUNTER_V2_QUERY = `
  query CourtCounterSnapshot($courtId: String!, $timestamp: BigInt!) {
    court(id: $courtId) {
      numberDisputes
    }
    pastSnapshot: courtCounters(
      where: { court: $courtId, timestamp_lte: $timestamp }
      orderBy: timestamp
      orderDirection: desc
      first: 1
    ) {
      numberDisputes
    }
  }
`;

interface Props {
  chainId: string;
  relTimestamp: string | Date;
  courtId: BigNumberish | string;
}

const useRelativeCourtDataV1 = ({ chainId, relTimestamp, courtId, enabled }: Props & { enabled: boolean }) => {
  return useQuery<number, Error>({
    queryKey: ['useRelativeCourtDataV1', chainId, relTimestamp, courtId],
    enabled,
    queryFn: async () => {
      const response = await apolloClientQuery<{ court: Court }>(chainId, query, { courtId });
      if (!response || !response.data) throw new Error('No response from TheGraph');

      const blockNumber = Number(await getBlockByDate(relTimestamp, chainId));
      if (!blockNumber) throw new Error('Could not determine block number');

      const responseRel = await apolloClientQuery<{ court: Court }>(chainId, relQuery, {
        blockNumber,
        courtId,
      });

      if (!responseRel) throw new Error('No response from TheGraph');

      return Number(response.data!.court.disputesNum) - Number(responseRel.data!.court.disputesNum);
    },
  });
};

const useRelativeCourtDataV2 = ({ chainId, relTimestamp, courtId, enabled }: Props & { enabled: boolean }) => {
  return useQuery<number, Error>({
    queryKey: ['useRelativeCourtDataV2', chainId, relTimestamp, courtId],
    enabled,
    queryFn: async () => {
      const unixTs = Math.floor(new Date(relTimestamp).getTime() / 1000).toString();
      const response = await apolloClientQuery<{
        court: { numberDisputes: string };
        pastSnapshot: Array<{ numberDisputes: string }>;
      }>(chainId, COURT_COUNTER_V2_QUERY, { courtId: String(courtId), timestamp: unixTs });

      if (!response?.data?.court) throw new Error('No court data from TheGraph v2');

      const current = Number(response.data.court.numberDisputes);
      const past = response.data.pastSnapshot[0] ? Number(response.data.pastSnapshot[0].numberDisputes) : 0;
      return current - past;
    },
  });
};

export const useRelativeCourtData = ({ chainId, relTimestamp, courtId }: Props) => {
  const isV2 = chainId === '42161';
  const v2 = useRelativeCourtDataV2({ chainId, relTimestamp, courtId, enabled: isV2 });
  const v1 = useRelativeCourtDataV1({ chainId, relTimestamp, courtId, enabled: !isV2 });
  return isV2 ? v2 : v1;
};

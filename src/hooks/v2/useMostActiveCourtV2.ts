import { COURTS_V2_QUERY, COURT_FIELDS_V2, CourtV2 } from '../../graphql/subgraphV2';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../../lib/apolloClient';
import { Court } from '../../graphql/subgraph';
import { getBlockByDate } from '../../lib/helpers';

const relQueryV2 = `
  query MostActiveCourtBlockQueryV2($blockNumber: Int!) {
    courts(first: 1000, block: { number: $blockNumber }, orderBy: id, orderDirection: asc) {
      ${COURT_FIELDS_V2}
    }
  }
`;

interface Props {
  chainId: string;
  relTimestamp?: string | Date;
  enabled?: boolean;
}

function pickMostActive(courts: CourtV2[]): Court {
  return courts.reduce((a, b) => (Number(a.numberDisputes) > Number(b.numberDisputes) ? a : b)) as unknown as Court;
}

function getCourtMaxDiff(initialCourts: CourtV2[], endCourts: CourtV2[]): Court {
  const diffs = initialCourts.map((court, idx) => {
    return Number(endCourts[idx].numberDisputes) - Number(court.numberDisputes);
  });
  const maxDiff = diffs.reduce((a, b) => (a > b ? a : b));
  return initialCourts[diffs.indexOf(maxDiff)] as unknown as Court;
}

export const useMostActiveCourtV2 = ({ chainId, relTimestamp, enabled = true }: Props) => {
  return useQuery<Court, Error>({
    queryKey: ['useMostActiveCourtV2', chainId, relTimestamp],
    enabled,
    queryFn: async () => {
      const response = await apolloClientQuery<{ courts: CourtV2[] }>(chainId, COURTS_V2_QUERY, {
        first: 1000,
        skip: 0,
      });
      if (!response?.data?.courts) throw new Error('No courts from TheGraph v2');

      if (relTimestamp) {
        const blockNumber = (await getBlockByDate(relTimestamp, chainId)).block;
        if (!blockNumber) throw new Error('Could not resolve block number');

        const responseRel = await apolloClientQuery<{ courts: CourtV2[] }>(chainId, relQueryV2, {
          blockNumber,
        });
        if (!responseRel?.data?.courts) throw new Error('No historical courts from TheGraph v2');

        return getCourtMaxDiff(responseRel.data.courts, response.data.courts);
      }

      return pickMostActive(response.data.courts);
    },
  });
};

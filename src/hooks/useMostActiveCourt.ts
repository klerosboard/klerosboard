import { Court, COURT_FIELDS } from '../graphql/subgraph';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../lib/apolloClient';
import { getBlockByDate } from '../lib/helpers';

const relQuery = `
    ${COURT_FIELDS}
    query MostActiveCourtBlockQuery($blockNumber:Int!) {
        courts(first: 1000, block:{number:$blockNumber}, orderBy:id, orderDirection:asc) {
        ...CourtFields
      }
    }
`;

const query = `
    ${COURT_FIELDS}
    query MostActiveCourtQuery {
        courts(first: 1000, orderBy:id, orderDirection:asc) {
        ...CourtFields
      }
    }
`;

interface Props {
  chainId: string;
  relTimestamp?: string | Date;
}

function getCourtMaxDiff(initialCourts: Court[], endCourts: Court[]): Court {
  const diffs = initialCourts.map((court, idx) => {
    return Number(endCourts[idx].disputesNum) - Number(court.disputesNum);
  });

  const maxDiffCourtId = diffs.reduce((a, b) => (a > b ? a : b));

  return initialCourts[diffs.indexOf(maxDiffCourtId)];
}

export const useMostActiveCourt = ({ chainId, relTimestamp }: Props) => {
  return useQuery<Court, Error>({
    queryKey: ['useMostActiveCourt', chainId, relTimestamp],
    enabled: !!chainId,
    queryFn: async () => {
      const response = await apolloClientQuery<{ courts: Court[] }>(chainId, query);
      if (!response || !response.data) throw new Error('No response from TheGraph');

      if (relTimestamp) {
        const blockNumber = (await getBlockByDate(relTimestamp, chainId)).block;

        if (!blockNumber) throw new Error('No response from Infura');

        const responseRel = await apolloClientQuery<{ courts: Court[] }>(chainId, relQuery, {
          blockNumber: blockNumber,
        });

        if (!responseRel) throw new Error('No response from TheGraph');
        return getCourtMaxDiff(responseRel.data!.courts, response.data!.courts);
      }
      return (response.data!.courts as Court[]).reduce((a: Court, b: Court) =>
        Number(a.disputesNum) > Number(b.disputesNum) ? a : b,
      );
    },
  });
};

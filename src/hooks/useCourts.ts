import { Court, COURT_FIELDS } from '../graphql/subgraph';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../lib/apolloClient';
import { buildQuery, QueryVariables } from '../lib/SubgraphQueryBuilder';
import { useCourtsV2 } from './v2/useCourtsV2';

const query = `
    ${COURT_FIELDS}
    query CourtsQuery(#params#) {
        courts(first: 1000, where:{#where#}, orderBy: id, orderDirection:asc) {
        ...CourtFields
      }
    }
`;

interface Props {
  chainId: string;
  subcourtID?: string;
}

const useCourtV1 = ({ chainId, subcourtID, enabled = true }: Props & { enabled?: boolean }) => {
  return useQuery<Court[], Error>({
    queryKey: ['useCourtV1', chainId, subcourtID],
    enabled,
    queryFn: async () => {
      const variables: QueryVariables = {};

      if (subcourtID) {
        variables['id'] = subcourtID;
      }

      const response = await apolloClientQuery<{ courts: Court[] }>(chainId, buildQuery(query, variables), variables);

      if (!response || !response.data) throw new Error('No response from TheGraph');

      return response.data!.courts;
    },
  });
};

export const useCourts = ({ chainId, subcourtID }: Props) => {
  const isV2 = chainId === '42161';
  const v2 = useCourtsV2({ chainId, subcourtID, enabled: isV2 });
  const v1 = useCourtV1({ chainId, subcourtID, enabled: !isV2 });
  return isV2 ? v2 : v1;
};

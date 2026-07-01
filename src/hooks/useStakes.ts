import { STAKES_FIELDS, StakeSet } from '../graphql/subgraph';
import { useQuery } from '@tanstack/react-query';
import { apolloClientQuery } from '../lib/apolloClient';
import { buildQuery, QueryVariables } from '../lib/SubgraphQueryBuilder';
import { useStakesV2 } from './v2/useStakesV2';

const query = `
    ${STAKES_FIELDS}
    query StakesQuery(#params#) {
      stakeSets(first: 1000, where:{#where#}, orderBy: timestamp, orderDirection: desc) {
        ...StakeSetFields
      }
    }
`;

interface Props {
  chainId: string;
  subcourtID?: string;
  jurorID?: string;
  enabled?: boolean;
}

function useStakesV1({ chainId, subcourtID, jurorID, enabled = true }: Props) {
  return useQuery<StakeSet[], Error>({
    queryKey: ['useStakesV1', chainId, subcourtID, jurorID],
    queryFn: async () => {
      const variables: QueryVariables = {};

      if (subcourtID) {
        variables['subcourtID'] = subcourtID;
      }
      if (jurorID) {
        variables['address'] = jurorID.toLowerCase();
      }

      const response = await apolloClientQuery<{ stakeSets: StakeSet[] }>(
        chainId,
        buildQuery(query, variables),
        variables,
      );

      if (!response || !response.data) throw new Error('No response from TheGraph');

      return response.data!.stakeSets;
    },
    enabled: enabled && !!chainId,
  });
}

export const useStakes = ({ chainId, subcourtID, jurorID }: Props) => {
  const isArbitrum = chainId === '42161';
  // Always call hooks — Rules of Hooks
  const v2Result = useStakesV2({ chainId, jurorID, subcourtID, enabled: isArbitrum });
  const v1Result = useStakesV1({ chainId, subcourtID, jurorID, enabled: !isArbitrum });
  return isArbitrum ? v2Result : v1Result;
};

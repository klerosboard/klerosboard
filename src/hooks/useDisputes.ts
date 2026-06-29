import { useQuery } from '@tanstack/react-query';
import { Dispute, DISPUTE_FIELDS } from '../graphql/subgraph';
import { apolloClientQuery } from '../lib/apolloClient';
import { buildQuery, QueryVariables } from '../lib/SubgraphQueryBuilder';
import { useDisputesV2 } from './v2/useDisputesV2';

const query = `
    ${DISPUTE_FIELDS}
    query DisputesQuery(#params#) {
      disputes(where:{#where#}, orderBy: startTime, orderDirection: desc, first:1000, skip:$skip) {
        ...DisputeFields
      }
    }
`;

interface Props {
  chainId: string;
  subcourtID?: string;
  arbitrableID?: string;
  creator?: string;
  enabled?: boolean;
}

const useDisputesV1 = ({
  chainId,
  subcourtID,
  arbitrableID,
  creator,
  enabled,
}: Props) => {
  return useQuery<Dispute[], Error>({
    queryKey: ['useDisputesV1', chainId, subcourtID, arbitrableID, creator],
    queryFn: async () => {
      let disputes: Dispute[] = [];
      const variables: QueryVariables = {};
      if (subcourtID) {
        variables['subcourtID'] = subcourtID.toLowerCase();
      }
      if (arbitrableID) {
        variables['arbitrable'] = arbitrableID.toLowerCase();
      }
      if (creator) {
        variables['creator'] = creator.toLowerCase();
      }
      variables['skip'] = 0;

      let response = await apolloClientQuery<{ disputes: Dispute[] }>(
        chainId,
        buildQuery(query, variables),
        variables,
      );

      if (!response || !response.data)
        throw new Error('No response from TheGraph');

      disputes = response.data!.disputes;

      while (response.data!.disputes.length === 1000) {
        variables['skip'] = disputes.length;

        response = await apolloClientQuery<{ disputes: Dispute[] }>(
          chainId,
          buildQuery(query, variables),
          variables,
        );

        if (!response || !response.data)
          throw new Error('No response from TheGraph');
        disputes = disputes.concat(response.data!.disputes);
      }

      return disputes;
    },
    enabled,
  });
};

export const useDisputes = ({
  chainId,
  subcourtID,
  arbitrableID,
  creator,
}: Props) => {
  const isV2 = chainId === '42161';
  console.log(`useDispute: `, isV2);
  const v2 = useDisputesV2({
    chainId,
    subcourtID,
    arbitrableID,
    creator,
    enabled: isV2,
  });
  const v1 = useDisputesV1({
    chainId,
    subcourtID,
    arbitrableID,
    creator,
    enabled: !isV2,
  });
  // v1 has its own enabled logic; we return the correct result based on chain
  return isV2 ? v2 : v1;
};

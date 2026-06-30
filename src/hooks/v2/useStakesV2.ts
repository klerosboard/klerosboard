import { useQuery } from '@tanstack/react-query';
import { StakeSet } from '../../graphql/subgraph';
import { STAKES_V2_QUERY, StakingEventV2, StakingEventsByCourtResponse } from '../../graphql/subgraphV2';
import { atlasQuery } from '../../lib/apolloClient';

interface Props {
  chainId: string;
  jurorID?: string;
  subcourtID?: string;
  enabled?: boolean;
}

/**
 * Maps v2 StakingEventV2 to v1-compatible StakeSet shape.
 * v2 provides on-chain staking events from Atlas via graphql-request (not Apollo).
 */
function mapStakingEventV2ToStakeSet(event: StakingEventV2): StakeSet {
  return {
    id: String(event.id),
    address: { id: event.args._address },
    subcourtID: event.args._courtID,
    stake: event.args._amount,
    newTotalStake: '0',
    timestamp: Number(event.blockTimestamp),
    gascost: '0',
  };
}

export const useStakesV2 = ({ chainId, jurorID, subcourtID, enabled = true }: Props) => {
  return useQuery<StakeSet[], Error>({
    queryKey: ['useStakesV2', chainId, jurorID, subcourtID],
    enabled: enabled && !!chainId && !!jurorID,
    queryFn: async (): Promise<StakeSet[]> => {
      const sortitionModule = import.meta.env.VITE_ARBITRUM_SORTITION_MODULE;

      // Build courtIDs filter
      const courtIDs = subcourtID ? [Number(subcourtID)] : [];

      const variables = {
        partialAddress: jurorID!.toLowerCase(),
        courtIDs,
        contract: {
          chainId: 42161,
          address: sortitionModule,
        },
        pagination: {
          skip: 0,
          take: 100,
          sortByTimeStamp: 'DESC',
        },
      };
      const PAGE_SIZE = 100;
      let skip = 0;
      let allItems: StakingEventV2[] = [];

      while (true) {
        const data = await atlasQuery<StakingEventsByCourtResponse>(STAKES_V2_QUERY, {
          ...variables,
          pagination: { skip, take: PAGE_SIZE, sortByTimeStamp: 'DESC' },
        });

        const page = data?.userStakingEventsV2;
        allItems = allItems.concat((page?.items ?? []).map((w) => w.item));

        if (!page?.hasNextPage) break;
        skip += PAGE_SIZE;
      }

      return allItems.map(mapStakingEventV2ToStakeSet);
    },
  });
};

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
    id: event.id,
    address: { id: event.args._address },
    subcourtID: BigInt(event.args._courtID),
    stake: BigInt(event.args._amount),
    newTotalStake: BigInt(0) as unknown as number | bigint | string, // Not available in v2 event
    timestamp: BigInt(event.blockTimestamp),
    gascost: BigInt(0) as unknown as number | bigint | string, // Not available in v2
  };
}

export const useStakesV2 = ({ chainId, jurorID, subcourtID, enabled = true }: Props) => {
  return useQuery<StakeSet[], Error>({
    queryKey: ['useStakesV2', chainId, jurorID, subcourtID],
    enabled: enabled && !!chainId && !!jurorID,
    queryFn: async (): Promise<StakeSet[]> => {
      const sortitionModule = import.meta.env.VITE_ARBITRUM_SORTITION_MODULE;

      // Build courtIDs filter
      const courtIDs = subcourtID ? [Number(subcourtID)] : null;

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
      const data = await atlasQuery<StakingEventsByCourtResponse>(STAKES_V2_QUERY, variables);

      if (!data || !data.userStakingEventsV2 || !data.userStakingEventsV2.items) {
        return [];
      }

      return data.userStakingEventsV2.items.map((wrapper) => wrapper.item).map(mapStakingEventV2ToStakeSet);
    },
  });
};

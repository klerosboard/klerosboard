import { StakingEventV2 } from '../../../graphql/subgraphV2';
import { StakeSet } from '../../../graphql/subgraph';

/**
 * Maps v2 StakingEventV2 to v1-compatible StakeSet shape.
 * v2 provides on-chain staking events from Atlas via graphql-request (not Apollo).
 * newTotalStake and gascost are not available in v2 — fallback to '0'.
 */
export function mapStakingEventV2ToStakeSet(event: StakingEventV2): StakeSet {
  return {
    id: String(event.id),
    address: { id: event.args._address },
    subcourtID: event.args._courtID,
    stake: event.args._amount,
    newTotalStake: '0', // Not available in v2
    timestamp: Number(event.blockTimestamp),
    gascost: '0', // Not available in v2
  };
}

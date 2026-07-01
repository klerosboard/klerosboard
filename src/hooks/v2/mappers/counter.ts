import { CounterV2 } from '../../../graphql/subgraphV2';
import { KlerosCounter } from '../../../graphql/subgraph';

/**
 * Maps v2 CounterV2 to v1-compatible KlerosCounter shape.
 * Not available in v2: courtsCount, phase dispute counts (evidence/commit/voting/appeal),
 * inactiveJurors, drawnJurors, numberOfArbitrables, totalUSDthroughContract.
 */
export function mapCounterV2ToKlerosCounter(v2: CounterV2): KlerosCounter {
  return {
    id: v2.id,
    disputesCount: v2.cases, // v2.cases → v1.disputesCount
    openDisputes: v2.casesVoting, // v2.casesVoting → v1.openDisputes (approx)
    closedDisputes: v2.casesRuled, // v2.casesRuled → v1.closedDisputes (approx)
    activeJurors: v2.activeJurors, // Direct mapping
    tokenStaked: v2.stakedPNK, // v2.stakedPNK → v1.tokenStaked
    totalETHFees: v2.paidETH, // v2.paidETH → v1.totalETHFees
    totalTokenRedistributed: v2.redistributedPNK, // v2.redistributedPNK → v1.totalTokenRedistributed
  };
}

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
    courtsCount: undefined as unknown as number | bigint | string, // Not available in v2
    disputesCount: v2.cases, // v2.cases → v1.disputesCount
    openDisputes: v2.casesVoting, // v2.casesVoting → v1.openDisputes (approx)
    closedDisputes: v2.casesRuled, // v2.casesRuled → v1.closedDisputes (approx)
    evidencePhaseDisputes: undefined as unknown as number | bigint | string, // Not available in v2
    commitPhaseDisputes: undefined as unknown as number | bigint | string, // Not available in v2
    votingPhaseDisputes: undefined as unknown as number | bigint | string, // Not available in v2
    appealPhaseDisputes: undefined as unknown as number | bigint | string, // Not available in v2
    activeJurors: v2.activeJurors, // Direct mapping
    inactiveJurors: undefined as unknown as number | bigint | string, // Not available in v2
    drawnJurors: undefined as unknown as number | bigint | string, // Not available in v2
    numberOfArbitrables: undefined as unknown as number | bigint | string, // Not available in v2
    tokenStaked: v2.stakedPNK, // v2.stakedPNK → v1.tokenStaked
    totalETHFees: v2.paidETH, // v2.paidETH → v1.totalETHFees
    totalTokenRedistributed: v2.redistributedPNK, // v2.redistributedPNK → v1.totalTokenRedistributed
    totalUSDthroughContract: undefined as unknown as number | bigint | string, // Not available in v2
  };
}

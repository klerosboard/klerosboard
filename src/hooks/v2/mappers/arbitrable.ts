import { ArbitrableV2 } from '../../../graphql/subgraphV2';
import { Arbitrable } from '../../../graphql/subgraph';

/**
 * Maps a v2 ArbitrableV2 to the v1-compatible Arbitrable shape.
 *
 * Available in v2: id, totalDisputes, and per-dispute: disputeID, period, ruled, createdAt, totalFeesForJurors.
 * Not available in v2: phase counts (open/closed/evidence/commit/voting/appeal), subcourtID, creator, txid.
 *
 * ethFees is derived by summing totalFeesForJurors across all rounds of all disputes.
 * disputes.rounds is omitted — v2 disputes expose only the fields mapped below.
 */
export function mapArbitrableV2ToArbitrable(v2: ArbitrableV2): Arbitrable {
  const totalFees = (v2.disputes ?? []).reduce((acc, d) => {
    const disputeFees = (d.rounds ?? []).reduce((sum, r) => sum + BigInt(r.totalFeesForJurors), 0n);
    return acc + disputeFees;
  }, 0n);

  return {
    id: v2.id,
    disputesCount: v2.totalDisputes,
    ethFees: totalFees.toString(),
    disputes: (v2.disputes ?? []).map((d) => ({
      id: d.disputeID,
      period: d.period,
      lastPeriodChange: d.createdAt,
      startTime: d.createdAt,
      ruled: d.ruled,
    })),
  };
}

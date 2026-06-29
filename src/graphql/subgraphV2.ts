/**
 * Kleros v2 Subgraph Types and Queries (Arbitrum)
 * Schema is structurally different from v1 (no creator field, different field names, etc.)
 * This file is kept separate to avoid union type pollution and maintain clean isolation.
 *
 * Schema reference: kleros/kleros-v2/subgraph/core/schema.graphql
 */

// ── TypeScript Interfaces ──────────────────────────────────────────────────

export interface CounterV2 {
  id: string;
  cases: string; // v1: disputesCount
  casesVoting: string; // v1: openDisputes (not exact equiv)
  casesRuled: string; // v1: closedDisputes (not exact equiv)
  activeJurors: string;
  stakedPNK: string; // v1: tokenStaked
  // NOTE: totalETHFees and totalUSDthroughContract not available in v2
}

export interface CourtV2 {
  id: string;
  policy?: string | null; // v2: plain URI string (v1 had policy.policy nested)
  name?: string | null;
  parent?: { id: string } | null;
  children: { id: string }[];
  hiddenVotes: boolean;
  minStake: string;
  alpha: string;
  feeForJuror: string;
  jurorsForCourtJump: string;
  timesPerPeriod: string[]; // v1: timePeriods
  numberStakedJurors: string; // v1: activeJurors
  numberDisputes: string;
  paidETH: string;
}

export interface ClassicVoteV2 {
  id: string;
  juror: { id: string };
  choice?: string | null;
  voted: boolean;
  commited: boolean;
}

export interface RoundV2 {
  id: string;
  nbVotes: string;
  tokensAtStakePerJuror: string;
  totalFeesForJurors: string;
  isCurrentRound: boolean;
}

export interface DisputeV2 {
  id: string;
  disputeID: string;
  court: { id: string; timesPerPeriod: string[]; policy?: string | null };
  arbitrated: { id: string }; // v1: arbitrable
  period: string;
  ruled: boolean;
  currentRuling: string; // v1: currentRulling (typo fixed in v2)
  tied: boolean;
  overridden: boolean;
  lastPeriodChange: string;
  createdAt?: string | null; // v1: startTime
  transactionHash: string; // v1: txid
  currentRoundIndex: string;
  // NOTE: creator field removed in v2
  // NOTE: gas cost fields removed in v2
}

export interface UserV2 {
  id: string;
  totalStake: string; // v1: totalStaked
  totalDisputes: string; // v1: numberOfDisputesAsJuror (all disputes)
  totalCoherentVotes: string; // v1: numberOfCoherentVotes
  totalResolvedVotes: string;
  coherenceScore: string; // v1: coherency
  activeDisputes: string;
  // NOTE: numberOfDisputesCreated omitted (creator removed in v2)
  // NOTE: gas cost fields removed in v2
}

export interface ArbitrableV2 {
  id: string;
  totalDisputes: string;
  // NOTE: v2 schema limitation — only id + totalDisputes available
}

// Atlas staking event types (mirrors kleros-v2/web/src/utils/fetchStakingEventsByCourt.ts)
export interface StakingEventV2 {
  id: string;
  transactionHash: string;
  blockTimestamp: string;
  args: {
    _address: string;
    _courtID: string;
    _amount: string;
  };
}

export interface StakingEventsByCourtResponse {
  userStakingEventsV2: {
    items: Array<{ item: StakingEventV2 }>;
    count: number;
  };
}

// ── GraphQL Fragment Strings ───────────────────────────────────────────────

export const COUNTER_FIELDS_V2 = `
  id
  cases
  casesVoting
  casesRuled
  activeJurors
  stakedPNK
`;

export const COURT_FIELDS_V2 = `
  id
  policy
  name
  parent { id }
  children { id }
  hiddenVotes
  minStake
  alpha
  feeForJuror
  jurorsForCourtJump
  timesPerPeriod
  numberStakedJurors
  numberDisputes
  paidETH
`;

export const USER_FIELDS_V2 = `
  id
  totalStake
  totalDisputes
  totalCoherentVotes
  totalResolvedVotes
  coherenceScore
  activeDisputes
`;

export const CLASSIC_VOTE_FIELDS_V2 = `
  id
  juror { id }
  choice
  voted
  commited
`;

export const DISPUTE_FIELDS_V2 = `
  id
  disputeID
  court { id timesPerPeriod policy }
  arbitrated { id }
  period
  ruled
  currentRuling
  tied
  overridden
  lastPeriodChange
  createdAt
  transactionHash
  currentRoundIndex
`;

export const ARBITRABLE_FIELDS_V2 = `
  id
  totalDisputes
`;

// ── GraphQL Query Strings ──────────────────────────────────────────────────

export const COUNTER_V2_QUERY = `
  query KlerosCounterV2 {
    counters(where: { id: "0" }) {
      ${COUNTER_FIELDS_V2}
    }
  }
`;

export const COURTS_V2_QUERY = `
  query CourtsV2($first: Int, $skip: Int) {
    courts(first: $first, skip: $skip, orderBy: id) {
      ${COURT_FIELDS_V2}
    }
  }
`;

export const COURT_V2_QUERY = `
  query CourtV2($id: ID!) {
    court(id: $id) {
      ${COURT_FIELDS_V2}
    }
  }
`;

export const DISPUTES_V2_QUERY = `
  query DisputesV2($first: Int, $skip: Int) {
    disputes(first: $first, skip: $skip, orderBy: disputeID, orderDirection: desc) {
      ${DISPUTE_FIELDS_V2}
    }
  }
`;

export const DISPUTE_V2_QUERY = `
  query DisputeV2($id: ID!) {
    dispute(id: $id) {
      ${DISPUTE_FIELDS_V2}
      disputeKitDispute {
        ... on ClassicDispute {
          id
          numberOfChoices
          localRounds {
            id
            votes {
              ${CLASSIC_VOTE_FIELDS_V2}
            }
          }
        }
      }
    }
  }
`;

export const USER_V2_QUERY = `
  query UserV2($id: ID!) {
    user(id: $id) {
      ${USER_FIELDS_V2}
      tokens {
        court { id name }
        staked
        locked
      }
    }
  }
`;

export const ARBITRABLES_V2_QUERY = `
  query ArbitrablesV2($first: Int, $skip: Int) {
    arbitrables(first: $first, skip: $skip) {
      ${ARBITRABLE_FIELDS_V2}
    }
  }
`;

export const ARBITRABLE_V2_QUERY = `
  query ArbitrableV2($id: ID!) {
    arbitrable(id: $id) {
      ${ARBITRABLE_FIELDS_V2}
      disputes(first: 20, orderBy: disputeID, orderDirection: desc) {
        id
        disputeID
        period
        ruled
        createdAt
      }
    }
  }
`;

export const USERS_V2_QUERY = `
  query UsersV2($first: Int, $skip: Int) {
    users(first: $first, skip: $skip, where: { totalStake_gt: "0" }) {
      ${USER_FIELDS_V2}
    }
  }
`;

// ── Atlas Query for Staking Events ─────────────────────────────────────────
// Sent to VITE_ATLAS_URI/graphql via graphql-request (not Apollo)
// Variables: { partialAddress, courtIDs, contract: { chainId: 42161, address: VITE_ARBITRUM_SORTITION_MODULE }, pagination }

export const STAKES_V2_QUERY = `
  query GetStakingEvents(
    $partialAddress: String!
    $courtIDs: [Int!]
    $contract: ContractInput!
    $pagination: PaginationArgs
  ) {
    userStakingEventsV2(
      partialAddress: $partialAddress
      courtIDs: $courtIDs
      contract: $contract
      pagination: $pagination
    ) {
      items {
        item {
          id
          transactionHash
          blockTimestamp
          args {
            _address
            _courtID
            _amount
          }
        }
      }
      count
    }
  }
`;

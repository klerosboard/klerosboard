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
  paidETH: string; // v1: totalETHFees
  redistributedPNK: string; // v1: totalTokenRedistributed
}

export interface CourtV2 {
  id: string;
  policy?: string | null;
  name?: string | null;
  parent?: { id: string } | null;
  children: { id: string }[];
  hiddenVotes: boolean;
  minStake: string;
  alpha: string;
  feeForJuror: string;
  jurorsForCourtJump: string;
  timesPerPeriod: string[];
  numberStakedJurors: string;
  numberDisputes: string;
  numberClosedDisputes: string;
  numberVotingDisputes: string;
  numberAppealingDisputes: string;
  paidETH: string;
  paidPNK: string;
  stake: string; // total PNK staked in this court
  effectiveStake: string;
}

export interface ClassicJustificationV2 {
  id: string;
  reference: string; // full justification text
  transactionHash: string;
  timestamp: string;
}

export interface ClassicVoteV2 {
  id: string;
  juror: { id: string };
  choice?: string | null;
  voted: boolean;
  commited: boolean;
  // Arbitrum-only: indexed by the coreneo subgraph as a linked ClassicJustification entity.
  justification?: ClassicJustificationV2 | null;
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
  templateId?: string | null; // points to DisputeTemplate in the DRT subgraph
  // NOTE: creator field removed in v2
  // NOTE: gas cost fields removed in v2
}

/**
 * Dispute Resolution Template — fetched from the kleros-v2-drt subgraph.
 * templateData is a JSON string containing title, description, answers, policyURI, etc.
 */
export interface DisputeTemplateV2 {
  id: string;
  templateTag: string;
  templateData: string; // JSON-encoded: { title, description, question, answers, policyURI, ... }
  templateDataMappings: string;
}

export interface DisputeTemplateDataV2 {
  title: string;
  description: string;
  question: string;
  category?: string;
  answers: Array<{ title: string; id: string; description: string }>;
  policyURI?: string;
  version?: string;
}

export interface UserV2 {
  id: string;
  totalStake: string;
  totalDisputes: string;
  totalCoherentVotes: string;
  totalResolvedVotes: string;
  coherenceScore: string;
  activeDisputes: string;
  shifts?: { ethAmount: string; pnkAmount: string }[];
}

export interface ArbitrableDisputeV2 {
  id: string;
  disputeID: string;
  period: string;
  ruled: boolean;
  createdAt: string;
  rounds: { totalFeesForJurors: string }[];
}

export interface ArbitrableV2 {
  id: string;
  totalDisputes: string;
  disputes?: ArbitrableDisputeV2[];
}

// Atlas staking event types (mirrors kleros-v2/web/src/utils/fetchStakingEventsByCourt.ts)
export interface StakingEventV2 {
  id: number | string;
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
    hasNextPage: boolean;
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
  paidETH
  redistributedPNK
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
  numberClosedDisputes
  numberVotingDisputes
  numberAppealingDisputes
  paidETH
  paidPNK
  stake
  effectiveStake
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

// Vote is an interface in v2 — ClassicVote-specific fields require an inline fragment.
export const CLASSIC_VOTE_FIELDS_V2 = `
  id
  juror { id }
  ... on ClassicVote {
    choice
    voted
    commited
    justification {
      id
      reference
      transactionHash
      timestamp
    }
  }
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
  templateId
`;

export const DISPUTE_TEMPLATE_V2_QUERY = `
  query DisputeTemplateV2($id: ID!) {
    disputeTemplate(id: $id) {
      id
      templateTag
      templateData
      templateDataMappings
    }
  }
`;

export const DISPUTE_TEMPLATES_BATCH_V2_QUERY = `
  query DisputeTemplatesBatch($first: Int, $id_gt: ID) {
    disputeTemplates(first: $first, where: { id_gt: $id_gt }, orderBy: id, orderDirection: asc) {
      id
      templateData
    }
  }
`;

export const DISPUTES_TEMPLATE_IDS_V2_QUERY = `
  query DisputesTemplateIds($first: Int, $id_gt: ID) {
    disputes(first: $first, where: { id_gt: $id_gt }, orderBy: id, orderDirection: asc) {
      id
      templateId
    }
  }
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

// Fetches the closest historical snapshot at or before a given Unix timestamp.
// The v2 subgraph stores periodic Counter snapshots with id = Unix timestamp (not "0").
export const COUNTER_SNAPSHOT_V2_QUERY = `
  query KlerosCounterSnapshotV2($timestamp: ID!) {
    counters(
      where: { id_lte: $timestamp, id_gt: "0" }
      first: 1
      orderBy: id
      orderDirection: desc
    ) {
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
  query DisputesV2($first: Int, $skip: Int, $id_gt: ID) {
    disputes(first: $first, skip: $skip, where: { id_gt: $id_gt }, orderBy: id, orderDirection: asc) {
      ${DISPUTE_FIELDS_V2}
    }
  }
`;

export const DISPUTE_V2_QUERY = `
  query DisputeV2($id: ID!) {
    dispute(id: $id) {
      ${DISPUTE_FIELDS_V2}
      rounds {
        id
        drawnJurors {
          id
          juror { id }
        }
      }
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
      shifts(first: 1000) {
        ethAmount
        pnkAmount
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
      disputes(first: 1000, orderBy: disputeID, orderDirection: desc) {
        id
        disputeID
        period
        ruled
        createdAt
        rounds {
          totalFeesForJurors
        }
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
      hasNextPage
    }
  }
`;

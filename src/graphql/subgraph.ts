import { BigNumberish } from "@ethersproject/bignumber";

export interface KlerosCounter {
    id: string
    courtsCount: BigNumberish
    disputesCount: BigNumberish
    openDisputes: BigNumberish
    closedDisputes: BigNumberish
    evidencePhaseDisputes: BigNumberish
    commitPhaseDisputes: BigNumberish
    votingPhaseDisputes: BigNumberish
    appealPhaseDisputes: BigNumberish
    activeJurors: BigNumberish
    inactiveJurors: BigNumberish
    drawnJurors: BigNumberish
    numberOfArbitrables: BigNumberish
    tokenStaked: BigNumberish
    totalETHFees: BigNumberish
    totalTokenRedistributed: BigNumberish
    totalUSDthroughContract: BigNumberish
}

export const KLEROSCOUNTERS_FIELDS = `
    fragment KlerosCountersFields on KlerosCounter {
        id
        courtsCount
        disputesCount
        openDisputes
        closedDisputes
        evidencePhaseDisputes
        commitPhaseDisputes
        votingPhaseDisputes
        appealPhaseDisputes
        activeJurors
        inactiveJurors
        drawnJurors
        numberOfArbitrables
        tokenStaked
        totalETHFees
        totalTokenRedistributed
        totalUSDthroughContract
    }
`;

export interface StakeData {
    id: BigNumberish
    juror: string
    stake: BigNumberish
    totalStake: BigNumberish
    subcourtId: BigNumberish
    timestamp: BigNumberish
    gascost: BigNumberish
}

export enum DisputePeriod {
    evidence = 0,
    cast = 1,
    vote = 2,
    appeal = 3,
    execution = 4
}

export interface Dispute {
    id: string,
    subcourtID: {
        id: string,
        timePeriods: BigNumberish[]
        policy: {
            policy: string
        }
    }
    arbitrable: { id: string }
    creator: { id: string }
    currentRulling: number
    period: string,
    lastPeriodChange: BigNumberish
    courtName: string
    startTime: BigNumberish
    ruled: boolean
    rounds: Round[]
    txid: string
}

export const DISPUTE_FIELDS = `
    fragment DisputeFields on Dispute {
    id
    subcourtID {
        id
        policy{policy}
        timePeriods
    }
    arbitrable{id}
    creator{id}
    currentRulling
    period
    lastPeriodChange
    startTime
    ruled
    txid
}`;

export const DISPUTEWITHVOTES_FIELDS = `
    fragment DisputeWithVotesFields on Dispute {
    id
    subcourtID {
        id
        timePeriods
        policy{policy}
    }
    arbitrable{id}
    creator{id}
    currentRulling
    period
    lastPeriodChange
    startTime
    ruled
    rounds{
        votes(first:1000){
            id
            address{id}
            choice
            voted
            timestamp
        }
    }
    }
`;


export interface Policy {
    id: string
    subcourtID: BigNumberish
    policy: string
    contractAddress: string
    timestamp: BigNumberish
    blockNumber: BigNumberish
}

export interface Round {
    id: string
    winningChoice: BigNumberish
    startTime: BigNumberish
    votes: Vote[]
}

export interface Vote {
    id: string
    dispute: {
        id: string,
        currentRulling: BigNumberish,
        subcourtID: {id: string},
        period: string
    }
    round: { id: string }
    voteID: BigNumberish
    address: { id: string }
    choice: BigNumberish
    voted: boolean
    salt: BigNumberish
    timestamp: BigNumberish
    commit: string
    commitGasUsed: BigNumberish
    commitGasPrice: BigNumberish
    commitGasCost: BigNumberish
    castGasUsed: BigNumberish
    castGasPrice: BigNumberish
    castGasCost: BigNumberish
    totalGasCost: BigNumberish
}

export const VOTE_FIELDS = `
    fragment VoteFields on Vote {
        id
        dispute{id,currentRulling,period,subcourtID{id}}
        round{ id}
        voteID
        address{id}
        choice
        voted
        salt
        timestamp
        commit
        commitGasUsed
        commitGasPrice
        commitGasCost
        castGasUsed
        castGasPrice
        castGasCost
        totalGasCost
    }
`;

export const ARBITRABLE_FIELDS = `
    fragment ArbitrableFields on Arbitrable {
        id
        disputesCount
        openDisputes
        closedDisputes
        evidencePhaseDisputes
        commitPhaseDisputes
        votingPhaseDisputes
        appealPhaseDisputes
        ethFees
    }
`;

export interface Arbitrable {
    id: string
    disputesCount: BigNumberish
    openDisputes: BigNumberish
    closedDisputes: BigNumberish
    evidencePhaseDisputes: BigNumberish
    commitPhaseDisputes: BigNumberish
    votingPhaseDisputes: BigNumberish
    appealPhaseDisputes: BigNumberish
    ethFees: BigNumberish
    disputes: [{
        creator: { id: string }
        currentRulling: number
        period: string,
        lastPeriodChange: BigNumberish
        courtName: string
        rounds: [Round]
        startTime: BigNumberish
        ruled: boolean
        subcourtID: {
            id: string,
            timePeriods: [BigNumberish]
            policy: {
                policy: string
            }
        }
    }]
}

export interface Court {
    id: string
    subcourtID: BigNumberish
    policy: { policy: string }
    parent: { id: string }
    childs: [{ id: string }]
    disputesCount: BigNumberish
    openDisputes: BigNumberish
    closedDisputes: BigNumberish
    evidencePhaseDisputes: BigNumberish
    commitPhaseDisputes: BigNumberish
    votingPhaseDisputes: BigNumberish
    appealPhaseDisputes: BigNumberish
    ethFees: BigNumberish
    activeJurors: BigNumberish
    disputesNum: BigNumberish
    disputesClosed: BigNumberish
    disputesOngoing: BigNumberish
    disputesAppealed: BigNumberish
    feeForJuror: BigNumberish
    minStake: BigNumberish
    alpha: BigNumberish
    tokenStaked: BigNumberish
    hiddenVotes: Boolean
    jurorsForCourtJump: BigNumberish
    timePeriods: BigNumberish[]
    totalETHFees: BigNumberish
    totalTokenRedistributed: BigNumberish
    name: string
    coherency: BigNumberish
    appealPercentage: BigNumberish
}

export const COURT_FIELDS = `
    fragment CourtFields on Court {
        id
        subcourtID
        disputesOngoing
        disputesClosed
        disputesAppealed
        disputesNum
        evidencePhaseDisputes
        commitPhaseDisputes
        votingPhaseDisputes
        appealPhaseDisputes
        childs{id}
        parent{id}
        policy{policy}
        tokenStaked
        activeJurors
        hiddenVotes
        minStake
        alpha
        feeForJuror
        jurorsForCourtJump
        timePeriods
        totalETHFees
        totalTokenRedistributed
        coherency
        appealPercentage
    }
`;

export interface StakeSet {
    id: string
    address: { id: string }
    subcourtID: BigNumberish
    stake: BigNumberish
    newTotalStake: BigNumberish
    timestamp: BigNumberish
    gascost: BigNumberish
}

export const STAKES_FIELDS = `
    fragment StakeSetFields on StakeSet {
        id
        address{id}
        subcourtID
        stake
        newTotalStake
        timestamp
        gasCost
    }
`;

export interface Juror {
    id: string
    totalStaked: BigNumberish
    numberOfDisputesAsJuror: BigNumberish
    numberOfDisputesCreated: BigNumberish
    ethRewards: BigNumberish
    tokenRewards: BigNumberish
    coherency: BigNumberish
    numberOfCoherentVotes: BigNumberish
    numberOfVotes: BigNumberish
    totalGasCost: BigNumberish
}

export const JUROR_FIELDS = `
    fragment JurorFields on Juror {
        id
        totalStaked
        numberOfDisputesAsJuror
        numberOfDisputesCreated
        ethRewards
        tokenRewards
        coherency
        numberOfCoherentVotes
        numberOfVotes
        totalGasCost
    }
`;
export interface JurorOdds {
    subcourtID: BigNumberish
    activeJurors: BigNumberish
    tokenStaked: BigNumberish
    stakeShare: BigNumberish
    odds: BigNumberish
    feeForJuror: BigNumberish
    voteStake: BigNumberish
    rewardRisk: BigNumberish
    minStake: BigNumberish
    alpha: BigNumberish
}

export interface Donor {
    id: string,
    totalDonated: BigNumberish,
    lastDonated: BigNumberish,
    lastDonatedTimestamp: BigNumberish,
    totalETHToUBIBurner: BigNumberish,
    donations: {
        id: string,
        amount: BigNumberish,
        timestamp: BigNumberish
    }
}

export const DONOR_FIELDS = `
    fragment DonorFields on Donor {
    id
    totalDonated
    lastDonated
    lastDonatedTimestamp
    totalETHToUBIBurner
    donations{id,amount,timestamp}
}
`
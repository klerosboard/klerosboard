import { Grid, Typography } from '@mui/material'
import React from 'react'
import { Vote } from '../../graphql/subgraph'
import USER_VIOLET from '../../assets/icons/user_violet.png';
import BALANCE_VIOLET from '../../assets/icons/balance_violet.png';
import { useDisputeDecision } from '../../hooks/useDisputeDecision';
import { BigNumberish } from 'ethers';
import VotePanel from './VotePanel';

interface Props {
    votes: Vote[]
    chainId: string
    disputeId: BigNumberish
    roundId: BigNumberish
}

function getMostVoted(votes: Vote[]): string {
    let count: { [id: string]: number; } = {}
    votes.forEach((vote) => {
        if (!vote.voted) return
        const choiceNum = vote.choice as string
        if (count[choiceNum]) {
            count[choiceNum] += 1;
        } else {
            count[choiceNum] = 1;
        }
    })
    if (Object.entries(count).length === 0) return 'Pending Votes'
    return Object.entries(count).reduce((a, b) => a[1] > b[1] ? a : b)[0]
}

function getAnyVote(votes: Vote[]): boolean {
    return votes.filter(v => v.voted).length > 0
}

export default function RoundPanel(props: Props) {
    const mostVoted = getMostVoted(props.votes);
    const anyVote = getAnyVote(props.votes);
    const decision = useDisputeDecision(props.chainId, props.disputeId, mostVoted, anyVote)

    return (
        <div key={`RoundPanel-${props.roundId as string}`}>
            <Grid container width={'100%'} sx={{ marginTop: '20px' }}>
                <Grid container item xs={12} columnSpacing={10} alignItems='center'>
                    <Grid item display='inline-flex' alignItems='center'>
                        <img src={USER_VIOLET} height='16px' alt='jurors' style={{ marginRight: '5px' }} /><Typography>{props.votes.length} Jurors</Typography>
                    </Grid> 
                    <Grid item display='inline-flex' alignItems='center'>
                        <img src={BALANCE_VIOLET} height='16px' alt='jury' style={{ marginRight: '5px' }} /><Typography>Jury Decision: </Typography><Typography>{decision}</Typography>
                    </Grid>
                </Grid>
                {
                    props.votes.length === 0 ? 
                    <Typography>Jurors weren't drawn yet</Typography>
                    :
                    props.votes.map((vote) => {
                        return <VotePanel vote={vote} chainId={props.chainId} />
                    })
                }

            </Grid>
        </div>
         )
}

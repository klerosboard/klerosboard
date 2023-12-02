import { Grid, Typography } from '@mui/material'
import React from 'react'
import { Vote } from '../../graphql/subgraph'
import USER_VIOLET from '../../assets/icons/user_violet.png';
import BALANCE_VIOLET from '../../assets/icons/balance_violet.png';
import { BigNumberish } from 'ethers';
import VotePanel from './VotePanel';
import { MetaEvidence } from '../../lib/types';
import { voteMapping } from '../../lib/helpers';
import StackedBarChart from '../StackedBarChart';

interface Props {
    votes: Vote[]
    chainId: string
    disputeId: BigNumberish
    roundId: BigNumberish
    metaEvidence?: MetaEvidence
}

function getVoteCount(votes: Vote[], metaEvidence: MetaEvidence | undefined): [string, number][] {
    let count: { [id: string]: number; } = {}
    votes.forEach((vote) => {
        const choice = voteMapping(vote.choice, vote.voted, vote.commit, metaEvidence ? metaEvidence.metaEvidenceJSON.rulingOptions.titles : undefined)
        if (count[choice]) {
            count[choice] += 1;
        } else {
            count[choice] = 1;
        }
    })

    let sortable: [id: string, value: number][] = [];
    for (var key in count) {
        sortable.push([key, count[key]]);
    }
    sortable.sort(function (a, b) {
        return b[1] - a[1];
    });
    return sortable
}

function getJuryDecision(sortedVotes: [string, number][], numVotes: number): string {
    const options = sortedVotes.map(([option, _]) => option);

    if (options.every(option => option === 'Pending')) {
    return "Pending decision";
    }

    const pendingOrCommitted = options.every(option => option === "Pending" || option === "Committed");
    if (pendingOrCommitted) {
        return "Decision to be revealed";
    }

    const maxVotes = sortedVotes[0][1];
    const tied = sortedVotes.filter(([_, votes]) => votes === maxVotes).length > 1;
    if (tied) {
        return "Tied";
    }

    return `${sortedVotes[0][0]} with ${sortedVotes[0][1]} votes (${(Number(sortedVotes[0][1]) / numVotes * 100).toPrecision(3)}%)`; // The option with the most votes
};

export default function RoundPanel(props: Props) {
    const sortedVotes = getVoteCount(props.votes, props.metaEvidence);
    const juryDecison = getJuryDecision(sortedVotes, props.votes.length);

    return (
        <div key={`RoundPanel-${props.roundId as string}`}>
            <Grid container width={'100%'} sx={{ marginTop: '20px' }}>
                <Grid container item xs={12} columnSpacing={10} alignItems='center'>
                    <Grid item display='inline-flex' alignItems='center'>
                        <img src={USER_VIOLET} height='16px' alt='jurors' style={{ marginRight: '5px' }} /><Typography>{props.votes.length} Jurors</Typography>
                    </Grid>
                    <Grid item display='inline-flex' alignItems='center'>
                        <img src={BALANCE_VIOLET} height='16px' alt='jury' style={{ marginRight: '5px' }} />
                        <Typography>Jury Decision:&nbsp;</Typography><Typography>{juryDecison}</Typography>
                    </Grid>
                    <Grid item display='inline-flex' alignItems='center' xs={12}>
                        <StackedBarChart data={sortedVotes} />
                    </Grid>    
                </Grid>
                
                {
                    props.votes.length === 0 ? 
                    <Typography>Jurors weren't drawn yet</Typography>
                    :
                    props.votes.slice().sort((a, b) => a.address.id.localeCompare(b.address.id)).map((vote) => {
                        return <VotePanel vote={vote} chainId={props.chainId} key={`VotePanel-${vote.id}`} metaEvidence={props.metaEvidence}/>
                    })
                }

            </Grid>
        </div>
    )
}

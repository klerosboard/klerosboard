import { Grid, Typography } from '@mui/material'
import React from 'react'
import { Vote } from '../../graphql/subgraph'
import USER_VIOLET from '../../assets/icons/user_violet.png';
import BALANCE_VIOLET from '../../assets/icons/balance_violet.png';
import { BigNumberish } from 'ethers';
import VotePanel from './VotePanel';
import { MetaEvidence } from '../../lib/types';
import { voteMapping } from '../../lib/helpers';

interface Props {
    votes: Vote[]
    chainId: string
    disputeId: BigNumberish
    roundId: BigNumberish
    metaEvidence?: MetaEvidence
}

function getMostVoted(votes: Vote[], metaEvidence: MetaEvidence | undefined): string {
    let count: { [id: string]: number; } = {}
    votes.forEach((vote) => {
        if (!vote.voted && vote.commit !== null) return
        
        const choiceNum = vote.choice as string
        if (count[choiceNum]) {
            count[choiceNum] += 1;
        } else {
            count[choiceNum] = 1;
        }
    })

    if (Object.entries(count).length === 0) return 'Pending Votes'
    if (Object.keys(count)[0] === 'null') return 'Commit Phase'

    let sortable: [id: string, value: number][] = [];
    for (var key in count) {
        sortable.push([key, count[key]]);
    }
    sortable.sort(function (a, b) {
        return b[1] - a[1];
    });
    if (sortable.length > 1 && sortable[0][1] === sortable[1][1]){
        return "Tied"
    }
    const anyVote = getAnyVote(votes)
    return voteMapping(sortable[0][0], anyVote, '', metaEvidence ? metaEvidence.metaEvidenceJSON.rulingOptions.titles : undefined)
}

function getAnyVote(votes: Vote[]): boolean {
    return votes.filter(v => v.voted).length > 0
}

export default function RoundPanel(props: Props) {
    const mostVoted = getMostVoted(props.votes, props.metaEvidence);

    return (
        <div key={`RoundPanel-${props.roundId as string}`}>
            <Grid container width={'100%'} sx={{ marginTop: '20px' }}>
                <Grid container item xs={12} columnSpacing={10} alignItems='center'>
                    <Grid item display='inline-flex' alignItems='center'>
                        <img src={USER_VIOLET} height='16px' alt='jurors' style={{ marginRight: '5px' }} /><Typography>{props.votes.length} Jurors</Typography>
                    </Grid>
                    <Grid item display='inline-flex' alignItems='center'>
                        <img src={BALANCE_VIOLET} height='16px' alt='jury' style={{ marginRight: '5px' }} /><Typography>Jury Decision:&nbsp;</Typography><Typography>{mostVoted}</Typography>
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

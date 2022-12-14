import { Divider, Grid, Typography } from '@mui/material'
import React from 'react'
import ARBITRABLE from '../../assets/icons/arbitrable_violet.png'
import COMMUNITY from '../../assets/icons/community_violet.png'
import BALANCE from '../../assets/icons/balance_violet.png'
import BOOKMARK from '../../assets/icons/bookmark.png'
import ArbitrableLink from '../ArbitrableLink'
import CourtLink from '../CourtLink';
import { BigNumberish } from 'ethers';
import { formatDate } from '../../lib/helpers';
import JurorLink from '../JurorLink';
import { MetaEvidence } from '../../lib/types'

interface Props {
    id: string
    chainId: string
    arbitrableId: string
    creatorId: string
    courtId: string
    startTimestamp: BigNumberish
    roundNum: number
    metaEvidence?: MetaEvidence
}


export default function CaseInfo(props: Props) {


    return (
        <div style={{
            width: '100%', margin: '20px 0px', background: '#FFFFFF',
            padding: '10px',
            border: '1px solid #E5E5E5',
            /* Card Drop Shadow */
            boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.06)',
            borderRadius: '3px',
        }}>
            <div style={{ width: '100%', margin: '20px 0px' }}>
                <Typography>
                    {props.metaEvidence ?
                        `${props.metaEvidence.metaEvidenceJSON.title}: ${props.metaEvidence.metaEvidenceJSON.question}`
                        : 'Error trying to read metaEvidence of the Dispute'
                    }
                </Typography>
                <a href={`https://court.kleros.io/cases/${props.id}`} target='_blank' rel='noreferrer'>Check the details on Court </a>
            </div>

            <Divider sx={{ margin: '10px 0px', width: '90%', marginLeft: '5%' }} />

            <div style={{ width: '100%', display: 'flex', margin: '10px 0px' }}>
                <Grid container justifyContent={'start'}>
                    <Grid container item xs={12} md={6} justifyContent='start' alignContent='center'>
                        <Grid item margin={'10px'}>
                            <img src={ARBITRABLE} height='24px' alt='arbitrable logo' />
                        </Grid>
                        <Grid container item xs={9}>
                            <Grid item xs={12}>
                                <ArbitrableLink id={props.arbitrableId} chainId={props.chainId} />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography sx={
                                    {
                                        fontStyle: 'normal',
                                        fontWeight: 400,
                                        fontSize: '14px',
                                        lineHeight: '19px',
                                    }
                                }>Arbitrable</Typography>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid container item xs={12} md={12} justifyContent='start' alignContent='center'>
                        <Grid item margin={'10px'}>
                            {/* TODO:  Change to Avatar*/}
                            <img src={COMMUNITY} height='24px' alt='community logo' />
                        </Grid>
                        <Grid container item xs={9}>
                            <Grid item xs={12}>
                                <JurorLink address={props.creatorId} chainId={props.chainId} />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography sx={
                                    {
                                        fontStyle: 'normal',
                                        fontWeight: 400,
                                        fontSize: '14px',
                                        lineHeight: '19px',
                                    }
                                }>Creator</Typography>
                            </Grid>
                        </Grid>
                    </Grid>

                </Grid>
            </div>

            <Divider sx={{ margin: '10px 0px', width: '90%', marginLeft: '5%' }} />
            <Grid container spacing={2}>
                <Grid item xs={12} display='inline-flex'>
                    <img src={BALANCE} height='24px' alt='court logo' /> <Typography>Court: </Typography><Typography><CourtLink chainId={props.chainId} courtId={props.courtId} /> </Typography>
                </Grid>
                <Grid item display='inline-flex'>
                    <img src={BOOKMARK} height='24px' alt='date' /> <Typography>Start Date: </Typography><Typography>{formatDate(props.startTimestamp as number)}</Typography>
                </Grid>
                <Grid item display='inline-flex'>
                    <img src={BALANCE} height='24px' alt='round' /> <Typography>Round: </Typography><Typography>{props.roundNum}</Typography>
                </Grid>
            </Grid>

        </div>
    )
}

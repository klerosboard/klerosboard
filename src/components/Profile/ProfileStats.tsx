import { Box, Divider, Grid, Skeleton, Typography, useMediaQuery, useTheme } from '@mui/material'
import React from 'react'
import { Juror } from '../../graphql/subgraph'
import ETHER_STYLED from '../../assets/icons/ethereum_styled.png';
import PNK_STYLED from '../../assets/icons/pnk_styled.png';
import FIAT from '../../assets/icons/fiat.png';
import { formatAmount, formatPNK } from '../../lib/helpers';
import CoherenceGraph from './CoherenceGraph';
import { useTokenInfo } from '../../hooks/useTokenInfo';
import { ethers } from 'ethers';

const dollarFormat = {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
}

interface Props {
    profile: Juror
    chainId: string
}


const grayFont = {
    fontWeight: 400,
    fontSize: '14px',
    lineHeight: '19px',
    color: '#999999'
}

export default function ProfileStats(props: Props) {
    const theme = useTheme()
    const breakpoint = useMediaQuery(theme.breakpoints.down("md"));
    const { data: ethInfo } = useTokenInfo('ethereum')
    const { data: pnkInfo } = useTokenInfo('kleros')

    return (
        <Box sx={{
            background: '#FFFFFF',
            border: '1px solid #E5E5E5',
            boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.06)',
            borderRadius: '3px',
            padding: '10px'
        }}>
            <Grid container direction='row' alignItems='center' justifyContent='space-between'>
                <Grid container item xs={12} md={5} direction='row' minHeight={'230px'}>
                    <Grid container item xs={6} direction='column' display='flex' alignItems='center' justifyContent='space-between'>
                        <Grid item>
                            <Typography>Juror in {props.profile.numberOfDisputesAsJuror} Cases</Typography>
                        </Grid>
                        <Grid container item xs={3} justifyContent='center' alignItems='center' direction='column'>
                            <Grid item>
                                <Typography sx={grayFont}>Coherency</Typography>
                            </Grid>
                            <Grid item>
                                <CoherenceGraph value={Number(props.profile.coherency)} />
                            </Grid>
                        </Grid>
                        <Grid item display='flex' xs={3} justifySelf='end' alignItems='center'>
                            <Typography sx={grayFont}>Coherent Votes:&nbsp;</Typography><Typography>{props.profile.numberOfCoherentVotes}/{props.profile.numberOfVotes}</Typography>
                        </Grid>

                    </Grid>
                    <Grid container item xs={6} direction='column' display='inline-flex' alignItems='start' justifyContent='space-between'>
                        <Grid item>
                            <Typography sx={grayFont}>Juror Rewards</Typography>
                        </Grid>
                        <Grid container item xs={3} alignItems='center' spacing={2}>
                            <Grid item><img src={ETHER_STYLED} alt='ether logo' height='48px' /></Grid>
                            <Grid item><Typography>{formatAmount(props.profile.ethRewards, props.chainId, true, true)}</Typography></Grid>
                            <Grid item>
                                <Typography sx={grayFont}>
                                    {ethInfo ?
                                        (ethInfo.current_price * Number(ethers.utils.formatEther(props.profile.ethRewards))).toLocaleString(undefined, dollarFormat)
                                        : <Skeleton />
                                    }
                                </Typography>
                            </Grid>
                        </Grid>
                        <Grid container item xs={3} alignItems='center' spacing={2}>
                            <Grid item><img src={PNK_STYLED} alt='pnk logo' height='48px' /></Grid>
                            <Grid item><Typography>{formatPNK(props.profile.tokenRewards, true, true)}</Typography></Grid>
                            <Grid item>
                                <Typography sx={grayFont}>
                                    {pnkInfo ?
                                        (pnkInfo.current_price * Number(ethers.utils.formatEther(props.profile.tokenRewards))).toLocaleString(undefined, dollarFormat)
                                        : <Skeleton />}
                                </Typography>
                            </Grid>

                        </Grid>
                    </Grid>
                </Grid>

                <Divider orientation='vertical' flexItem={true} sx={breakpoint ? { display: "none" } : null} />

                <Grid container item xs={12} md={5} direction='row'>

                    <Grid container item xs={6} direction='column' display='flex' alignItems='center' justifyContent='space-between'>
                        <Grid item>
                            <Typography sx={grayFont}>Gas Cost for voting</Typography>
                        </Grid>
                        <Grid container item xs={4} alignItems='center' spacing={2}>
                            <Grid item><img src={ETHER_STYLED} alt='ether logo' height='48px' /></Grid>
                            <Grid item><Typography>{formatAmount(props.profile.totalGasCost, props.chainId, true, true)}</Typography></Grid>
                            <Grid item><Typography sx={grayFont}>
                                {ethInfo ?
                                    (ethInfo.current_price * Number(ethers.utils.formatEther(props.profile.totalGasCost))).toLocaleString(undefined, dollarFormat)
                                    : <Skeleton />
                                }
                            </Typography></Grid>
                        </Grid>
                    </Grid>

                    <Grid container item xs={6} direction='column' display='flex' alignItems='center' justifyContent='space-between'>
                        <Grid item>
                            <Typography sx={grayFont}>Net Rewards</Typography>
                        </Grid>
                        <Grid container item xs={4} alignItems='center' spacing={2}>
                            <Grid item><img src={FIAT} alt='fiat logo' height='48px' /></Grid>
                            <Grid item>
                                <Typography>
                                    {/* TODO: Get historical price for eth votes */}
                                    {ethInfo ?
                                        (ethInfo.current_price * (Number(ethers.utils.formatEther(props.profile.ethRewards)) - Number(ethers.utils.formatEther(props.profile.totalGasCost)))).toLocaleString(undefined, dollarFormat)
                                        : <Skeleton />
                                    }</Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

        </Box>
    )
}

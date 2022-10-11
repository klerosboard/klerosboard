
import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom';
import { Grid, Skeleton } from '@mui/material';
import { useKlerosCounter } from '../hooks/useKlerosCounters'
import { formatAmount, formatPNK, getChainId } from '../lib/helpers';
import {subDays } from 'date-fns';

import Header from '../components/Header';
import StatCard from '../components/StatCard';

// Logos
import DASHBOARD from '../assets/icons/dashboard_violet.png';
import BALANCE from '../assets/icons_stats/balance_orange.png';
import DICE from '../assets/icons_stats/dice_violet.png';
import REWARD_UP from '../assets/icons_stats/reward_up.png';
import REWARD from '../assets/icons_stats/reward.png';
import COMMUNITY from '../assets/icons_stats/community_green.png';
import COMMUNITY_NO_CIRCLE from '../assets/icons_stats/community_no_circle.png';
import ARROW_UP from '../assets/icons_stats/arrow_up_violet.png';
import KLEROS from '../assets/icons_stats/kleros.png';
import KLEROS_ORACLE from '../assets/icons_stats/kleros_oracle.png';
import KLEROS_ARROWS from '../assets/icons_stats/kleros_arrows.png';
import KLEROS_CIRCLE from '../assets/icons_stats/kleros_circle.png';
import ETHEREUM from '../assets/icons_stats/ethereum.png';
import STATS from '../assets/icons_stats/stats.png';
import LatestDisputes from '../components/LatestDisputes';
import LatestStakes from '../components/LatestStakes';
import { BigNumberish, ethers } from 'ethers';
import { useMostActiveCourt } from '../hooks/useMostActiveCourt';
import CourtLink from '../components/CourtLink';


const row_css = {
  justifyContent: 'space-between',
  alignItems: 'center',
  border:  '1px solid #E5E5E5',
  boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.06)',
  borderRadius:'3px',
  margin: '10px 0px',
  paddingTop: '0px'
}

function stakingReward(chainId:string, totalStaked:BigNumberish | undefined): number {

  if (chainId === '100') {
    if (totalStaked) return 100000 / Number(ethers.utils.formatUnits(totalStaked, 'ether')) * 100 * 12
  }
  if (totalStaked) return 900000 / Number(ethers.utils.formatUnits(totalStaked, 'ether')) * 100 * 12
  return 0
}



export default function Home() {
  let [searchParams] = useSearchParams();
  const chainId = getChainId(searchParams)
  const { data: kc } = useKlerosCounter(chainId);
  const {data: mostActiveCourt} = useMostActiveCourt({chainId:chainId});
  const [relativeDate, setRelativeDate] = useState<Date>(new Date())  // To avoid refetching the query
  const {data: mostActiveCourtRelative} = useMostActiveCourt({chainId:chainId, relTimestamp:subDays(relativeDate, 7)});
  
  return (
    <div>
      <Header
        logo={DASHBOARD}
        title='Dashboard'
        text='Welcome to Klerosboard! Find metrics and insights about Kleros.'
      />
      <Grid container justifyContent='center' alignItems='start'>
        <Grid container item columnSpacing={0} sx={row_css}>
          <Grid item xs={12} md={4} lg={3}><StatCard title={'Most Active Court'} subtitle={'All times'} value={mostActiveCourt?<CourtLink chainId={chainId} courtId={mostActiveCourt.id} />:<Skeleton />} image={BALANCE} /></Grid>
          <Grid item xs={12} md={4} lg={3}><StatCard title={'Most Active Court'} subtitle={'Last 7 days'} value={mostActiveCourtRelative?<CourtLink chainId={chainId} courtId={mostActiveCourtRelative.id} />:<Skeleton />} image={BALANCE} /></Grid>
          <Grid item xs={12} md={4} lg={3}><StatCard title={'Highest Draw Chance'} subtitle={'All times'} value={'Marketing'} image={DICE} /></Grid>
          <Grid item xs={12} md={4} lg={3}><StatCard title={'Highest reward chance'} subtitle={'All times'} value={'Technical Court'} image={REWARD_UP} /></Grid>
        </Grid>
        <Grid container item columnSpacing={0} sx={row_css}>
          <Grid item xs={12} md={4} lg={2}><StatCard title={'PNK Staked'} subtitle={'All times'} value={kc? formatPNK(kc.tokenStaked) : undefined} image={KLEROS} /></Grid>
          <Grid item xs={12} md={4} lg={2}><StatCard title={'ETH Paid'} subtitle={'All times'} value={kc? formatAmount(kc.totalETHFees, chainId): undefined} image={ETHEREUM} /></Grid>
          <Grid item xs={12} md={4} lg={2}><StatCard title={'PNK Redistributed'} subtitle={'All times'} value={kc? formatPNK(kc.totalTokenRedistributed) : undefined} image={KLEROS_ORACLE} /></Grid>
          <Grid item xs={12} md={4} lg={2}><StatCard title={'Active Jurors'} subtitle={'All times'} value={kc?.activeJurors} image={COMMUNITY} /></Grid>
          <Grid item xs={12} md={4} lg={2}><StatCard title={'Cases'} subtitle={'All times'} value={kc?.disputesCount} image={BALANCE} /></Grid>
        </Grid>
        <Grid container item columnSpacing={1} sx={row_css}>
          <Grid item xs={12} md={4} lg={2}><StatCard title={'PNK Total Supply'} subtitle={'18% Staked'} value={'1,000,000 PNK'} image={KLEROS_CIRCLE} /></Grid>
          <Grid item xs={12} md={4} lg={2}><StatCard title={'Circulating Supply'} subtitle={'24% Staked'} value={'800,000 PNK'} image={KLEROS_ARROWS} /></Grid>
          <Grid item xs={12} md={4} lg={2}><StatCard title={'PNK Volume in 24h'} subtitle={'Price change: +0.5%'} value={'$200,081.00'} image={STATS} /></Grid>
          <Grid item xs={12} md={4} lg={2}><StatCard title={'PNK Price'} subtitle={'ETH = $1,258.15'} value={'$ .05'} image={KLEROS} /></Grid>
          <Grid item xs={12} md={4} lg={2}><StatCard title={'Staking Rewards'} subtitle={'APY'} value={`${stakingReward(chainId, kc?.tokenStaked).toFixed(2)}%`} image={REWARD} /></Grid>
        </Grid>
        <Grid container item columnSpacing={0} justifyContent='center' alignContent='center'>
          <Grid item xs={3}><img height={'14px'} src={COMMUNITY_NO_CIRCLE} alt={'Community logo'} style={{marginRight: '15px'}}/>Jurors' growth: {'123'}</Grid>
          <Grid item xs={3}><img height={'14px'} src={ARROW_UP} alt={'Arrow'} style={{marginRight: '15px'}}/>Adoption: {'123'} new jurors</Grid>
          <Grid item xs={3}><img height={'14px'} src={ARROW_UP} alt={'Arrow'} style={{marginRight: '15px'}}/>Retention {'33%'}</Grid>
        </Grid>
      </Grid>

      <Grid container spacing={2} style={{ marginTop: '40px' }}>

        <Grid item xs={12} md={6}>
          <LatestStakes chainId={chainId} />
        </Grid>

        <Grid item xs={12} md={6}>
          <LatestDisputes chainId={chainId} courtId={undefined}/>
        </Grid>

      </Grid>

    </div>
  )
}

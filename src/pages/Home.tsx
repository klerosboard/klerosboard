import { Avatar, Card, Grid, Typography } from '@mui/material';
import { DataGrid, GridRenderCellParams } from '@mui/x-data-grid';
import React from 'react'
import { Link as LinkRouter, useSearchParams } from 'react-router-dom';
import { Link } from '@mui/material';
import CourtLink from '../components/CourtLink';
import { useDisputes } from '../hooks/useDisputes';
import { useKlerosCounter } from '../hooks/useKlerosCounters'
import { useStakes } from '../hooks/useStakes';
import { formatPNK, getChainId } from '../lib/helpers';
import { Court, Juror } from '../graphql/subgraph';
import { shortenAddress } from '@usedapp/core';
import { BigNumberish } from 'ethers';
import Header from '../components/Header';
import BasicCard from '../components/Home/BasicCard';

// Logos
import BALANCE from '../assets/icons_stats/balance_orange.png';
import DICE from '../assets/icons_stats/dice_violet.png';
import REWARD_UP from '../assets/icons_stats/reward_up.png';
import REWARD from '../assets/icons_stats/reward.png';
import COMMUNITY from '../assets/icons_stats/community_green.png';
import ARROW_UP from '../assets/icons_stats/arrow_up_violet.png';
import KLEROS from '../assets/icons_stats/kleros.png';
import KLEROS_ORACLE from '../assets/icons_stats/kleros_oracle.png';
import KLEROS_ARROWS from '../assets/icons_stats/kleros_arrows.png';
import KLEROS_CIRCLE from '../assets/icons_stats/kleros_circle.png';
import ETHEREUM from '../assets/icons_stats/ethereum.png';
import STATS from '../assets/icons_stats/stats.png';


const row_css = {
  justifyContent: 'space-between',
  alignContent: 'center',
  border:  '1px solid #E5E5E5',
  boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.06)',
  borderRadius:'3px'
}

export default function Home() {
  let [searchParams] = useSearchParams();
  const chainId = getChainId(searchParams)
  const { data: kc, isLoading } = useKlerosCounter(chainId);
  const { data: disputes, isLoading: disputes_loading } = useDisputes(chainId);
  const { data: stakes, isLoading: stakes_loading } = useStakes(chainId);

  const dispute_columns = [
    { field: 'id', headerName: '#', flex: 1 },
    {
      field: 'subcourtID', headerName: 'Court', flex: 2, renderCell: (params: GridRenderCellParams<Court>) => (
        <CourtLink chainId={chainId} courtId={params.value!.id as string} />
      )
    },
    {
      field: 'currentRulling', headerName: 'Current Ruling', flex: 1
    },
    { field: 'period', headerName: 'Period', flex: 1 },

  ];

  const columns_stakes = [
    {
      field: 'address', headerName: 'Juror', flex: 1, renderCell: (params: GridRenderCellParams<Juror>) => (
        <Link component={LinkRouter} to={'/profile/' + params.value!.id} children={shortenAddress(params.value!.id)} />
      )
    },
    {
      field: 'subcourtID', headerName: 'Court Name', flex: 2, renderCell: (params: GridRenderCellParams<BigNumberish>) => (
        <CourtLink chainId={chainId} courtId={params.value! as string} />
      )
    },
    {
      field: 'stake', headerName: 'Last Stake', flex: 1, valueFormatter: (params: { value: BigNumberish }) => {
        return formatPNK(params.value);
      }
    },
  ];


  return (
    <div>
      <Header
        logo='../assets/icons/dashboard_violet.png'
        title='Dashboard'
        text='Welcome to Klerosboard! Find metrics and insights about Kleros.'
      />
      <Grid container rowSpacing={4}>
        <Grid container item spacing={1} sx={row_css}>
          <Grid item xs={3} lg={3}><BasicCard title={'Most Active Court'} subtitle={'All times'} value={'Token Listing'} image={BALANCE} /></Grid>
          <Grid item xs={3} lg={3}><BasicCard title={'Most Active Court'} subtitle={'All times'} value={'Humanit Court'} image={BALANCE} /></Grid>
          <Grid item xs={3} lg={3}><BasicCard title={'Highest Draw Chance'} subtitle={'All times'} value={'Marketing'} image={DICE} /></Grid>
          <Grid item xs={3} lg={3}><BasicCard title={'Highest reward chance'} subtitle={'All times'} value={'Technical Court'} image={REWARD_UP} /></Grid>
        </Grid>
        <Grid container item spacing={1} sx={row_css}>
          <Grid item xs={4} lg={2}><BasicCard title={'PNK Staked'} subtitle={'All times'} value={'test'} image={KLEROS} /></Grid>
          <Grid item xs={4} lg={2}><BasicCard title={'ETH Paid'} subtitle={'All times'} value={'test'} image={ETHEREUM} /></Grid>
          <Grid item xs={4} lg={2}><BasicCard title={'PNK Redistributed'} subtitle={'All times'} value={'test'} image={KLEROS_ORACLE} /></Grid>
          <Grid item xs={4} lg={2}><BasicCard title={'Active Jurors'} subtitle={'All times'} value={'test'} image={COMMUNITY} /></Grid>
          <Grid item xs={4} lg={2}><BasicCard title={'Cases'} subtitle={'All times'} value={'test'} image={BALANCE} /></Grid>
        </Grid>
        <Grid container item spacing={1} sx={row_css}>
          <Grid item xs={4} lg={2}><BasicCard title={'PNK Staked'} subtitle={'All times'} value={'test'} image={KLEROS_CIRCLE} /></Grid>
          <Grid item xs={4} lg={2}><BasicCard title={'ETH Paid'} subtitle={'All times'} value={'test'} image={KLEROS_ARROWS} /></Grid>
          <Grid item xs={4} lg={2}><BasicCard title={'PNK Redistributed'} subtitle={'All times'} value={'test'} image={STATS} /></Grid>
          <Grid item xs={4} lg={2}><BasicCard title={'Active Jurors'} subtitle={'All times'} value={'test'} image={KLEROS} /></Grid>
          <Grid item xs={4} lg={2}><BasicCard title={'Cases'} subtitle={'All times'} value={'test'} image={REWARD} /></Grid>
        </Grid>
        <Grid container item spacing={1} justifyContent='center' alignContent='center'>
          <Grid item xs={2}><img height={'14px'} src={COMMUNITY} alt={'Community logo'} style={{marginRight: '15px'}}/>Jurors' growth: {'123'}</Grid>
          <Grid item xs={2}><img height={'14px'} src={ARROW_UP} alt={'Arrow'} style={{marginRight: '15px'}}/>Adoption: {'123'} new jurors</Grid>
          <Grid item xs={2}><img height={'14px'} src={ARROW_UP} alt={'Arrow'} style={{marginRight: '15px'}}/>Retention {'33%'}</Grid>
        </Grid>
      </Grid>

      <Grid container spacing={2} style={{ marginTop: '40px' }}>

        <Grid item xs={6}>
          <Typography>Latest Stakes</Typography>
          {<DataGrid
            sx={{ marginTop: '30px' }}
            rows={stakes ? stakes! : []}
            columns={columns_stakes}
            loading={stakes_loading}
            pageSize={10}
            disableSelectionOnClick
            autoHeight={true}
            hideFooter={true}
          />}
        </Grid>


        <Grid item xs={6}>
          <Typography>Latest Cases</Typography>
          {<DataGrid
            sx={{ marginTop: '30px' }}
            rows={disputes ? disputes! : []}
            columns={dispute_columns}
            loading={disputes_loading}
            pageSize={10}
            disableSelectionOnClick
            autoHeight={true}
            hideFooter={true}
          />}

        </Grid>

      </Grid>

    </div>
  )
}

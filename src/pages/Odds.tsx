import { Box, Grid, Skeleton, TextField, Typography } from '@mui/material'
import React, { ChangeEventHandler, useEffect, useState } from 'react'
import Header from '../components/Header'
import DICE from '../assets/icons/dice_violet.png';
import { DataGrid, GridRenderCellParams } from '@mui/x-data-grid';
import { Court, JurorOdds } from '../graphql/subgraph';
import CourtLink from '../components/CourtLink';
import { useSearchParams } from 'react-router-dom';
import { formatAmount, getChainId } from '../lib/helpers';
import { useCourts } from '../hooks/useCourts';
import { BigNumberish, ethers } from 'ethers';

function getVoteStake(minStake: BigNumberish, alpha: BigNumberish): number {
  return Number(ethers.utils.formatUnits(minStake, 'ether')) * Number(alpha) / 10000
}

function getOdds(totalStaked: number, tokenStaked: number, nJurors: number): number {
  // todo
  if (tokenStaked === 0) return 0;
  return 0.002
}

function getRewardRisk(feeForJuror: number, voteStake: number): number {
  // todo: convert feeForJuror to PNK or viceverza
  return feeForJuror / voteStake
}

const formStyle = {
  border: '1px solid #E5E5E5',
  borderRadius: '3px'
}

export default function Odds() {
  let [searchParams] = useSearchParams();
  const chainId = getChainId(searchParams);
  const { data: courts, isLoading } = useCourts(chainId);
  const [odds, setOdds] = useState<JurorOdds[] | undefined>(undefined);
  const [pnkStaked, setPnkStaked] = useState<number>(100000);
  const [nJurors, setNJurors] = useState<number>(3);
  const [court, setCourt] = useState<string | undefined>(undefined);
  const [pageSize, setPageSize] = useState<number>(10);


  const handleSetNJuror = (e: React.ChangeEvent<HTMLInputElement>)=> {
    setNJurors(Number(e.currentTarget.value))
  }

  const handleSetPNKStaked = (e: React.ChangeEvent<HTMLInputElement>)=> {
    setPnkStaked(Number(e.target.value));
  }

  const handleSetCourt = (e: React.ChangeEvent<HTMLInputElement>)=> {
    setCourt(e.currentTarget.value)
  }
  useEffect(() => {
    if (courts) {
      console.log('updating odds')
      let odds: JurorOdds[] = [];
      courts.forEach((court: Court) => {
        const voteStake = getVoteStake(court.minStake, court.alpha);
        let extraValues = {
          stakeShare: court.tokenStaked as number / pnkStaked,
          odds: getOdds(court.tokenStaked as number, pnkStaked, nJurors),
          voteStake: voteStake,
          rewardRisk: getRewardRisk(court.feeForJuror as number, voteStake)
        }
        odds.push(Object.assign({}, court, extraValues));
      })
      setOdds(odds);
    }
  }, [courts, pnkStaked, nJurors])

  const columns = [
    {
      field: 'subcourtID', headerName: 'Court Name', flex: 2, renderCell: (params: GridRenderCellParams<BigNumberish>) => (
        <CourtLink chainId={chainId} courtId={params.value! as string} />
      )
    },
    {
      field: 'activeJurors', headerName: 'Jurors', flex: 1, type: 'number', valueFormatter: (params: { value: BigNumberish }) => {
        return Number(params.value)
      }
    },
    {
      field: 'tokenStaked', headerName: 'Total Staked', flex: 1, valueFormatter: (params: { value: BigNumberish }) => {
        const valueFormatted = Number(params.value).toLocaleString(undefined, { maximumFractionDigits: 0 });
        return `${valueFormatted}`;
      }
    },
    {
      field: 'stakeShare', headerName: 'Stake Share', flex: 1, valueFormatter: (params: { value: number }) => {
        const valueFormatted = Number(params.value * 100).toFixed(2);
        return `${valueFormatted} %`;
      }
    },
    {
      field: 'odds', headerName: 'Odds', flex: 1, valueFormatter: (params: { value: number }) => {
        const valueFormatted = Number(params.value * 100).toFixed(2);
        return `${valueFormatted} %`;
      }
    },
    {
      field: 'feeForJuror', headerName: 'Fee for Jurors', flex: 1, valueFormatter: (params: { value: BigNumberish }) => {
        return formatAmount(params.value, chainId);
      }
    },
    {
      field: 'voteStake', headerName: 'Vote Stake', flex: 1, renderCell: (params: { row: { minStake: BigNumberish, alpha: BigNumberish } }) => {
        return (getVoteStake(params.row.minStake, params.row.alpha).toLocaleString() + ' PNK');
      }
    },
    { field: 'rewardRisk', headerName: 'Reward/Risk', flex: 1, valueFormatter: (params: { value: BigNumberish }) => { return Number(params.value) } },
  ];


  return (
    <div>
      <Header
        logo={DICE}
        title='Juror Odds'
        text='Check your chances to be drawn as a juror on Kleros Courts.'
      />
      <Grid container rowSpacing={4} justifyContent={'center'}>
        {/* Search section */}
        <Grid item sm={6} md={4}>
          <Typography>Search by Court</Typography>
          <TextField id="outlined-basic" label="Search" variant="outlined" onChange={handleSetCourt} sx={formStyle} />
        </Grid>
        <Grid item sm={6} md={4}>
          <Typography>PNK Staked</Typography>
          <TextField id="outlined-basic" value={pnkStaked} variant="outlined" onChange={handleSetPNKStaked} sx={formStyle} />
        </Grid>
        <Grid item sm={6} md={4}>
          <Typography>Number of Jurors</Typography>
          <TextField id="outlined-basic" value={nJurors} variant="outlined" onChange={handleSetNJuror} sx={formStyle} />
        </Grid>
      </Grid>
      <Box display={'inline-flex'} margin={'20px 0px 40px'} alignItems={'center'}>
        <img src={DICE} height='13px' width='13px' alt='dice' style={{marginRight: '10px'}}/>
        <Typography sx={{
          fontStyle: 'normal',
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '19px',
          color: '#999999',
        }}>Juror Odds for General Court:</Typography>
        <Typography sx={{
          fontStyle: 'normal',
          fontWeight: 600,
          fontSize: '14px',
          lineHeight: '19px',
          color: '#333333',
        }}>{
          odds
          ? `1 in ${odds[0].odds as number === 0? 0: 1/(odds[0].odds as number)} (${(odds[0].odds as number)* 100} %)`
          : <Skeleton width={'40px'}/>}</Typography>
        </Box>

      {<DataGrid
        rows={odds ? odds! : []}
        columns={columns}
        loading={isLoading}
        pageSize={pageSize}
        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
        rowsPerPageOptions={[10, 50, 100]}
        pagination
        disableSelectionOnClick
        autoHeight={true}
      />}

    </div >
  )
}

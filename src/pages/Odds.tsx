import { Box, Grid, Skeleton, TextField, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import Header from '../components/Header'
import DICE from '../assets/icons/dice_violet.png';
import { DataGrid, GridRenderCellParams } from '@mui/x-data-grid';
import { Court, JurorOdds } from '../graphql/subgraph';
import CourtLink from '../components/CourtLink';
import { useParams } from 'react-router-dom';
import { formatAmount, getVoteStake } from '../lib/helpers';
import { useCourts } from '../hooks/useCourts';
import { BigNumberish, ethers } from 'ethers';
import { useTokenInfo } from '../hooks/useTokenInfo';



function getOdds(totalStaked: number, tokenStaked: number, nJurors: number): number {
  if (tokenStaked === 0) return 0;
  if (totalStaked === 0) return 0;
  if (nJurors === 0) return 0;      
  const p = tokenStaked/totalStaked
  const noDrawn = (1 - p)**nJurors
  return 1 - noDrawn

}

function getRewardRisk(feeForJuror: BigNumberish, voteStake: BigNumberish, pnkEth: number|undefined): number {
  if (!pnkEth) return 0
  return Number(ethers.utils.formatEther(feeForJuror)) / (Number(voteStake) * pnkEth!); 
}

const formStyle = {
  border: '1px solid #E5E5E5',
  borderRadius: '3px'
}

export default function Odds() {
  let {chainId} = useParams();
  chainId = chainId || '1';
  const [court, setCourt] = useState<string | undefined>(undefined);
  const { data: courts, isLoading } = useCourts({chainId:chainId, subcourtID:court});
  const [odds, setOdds] = useState<JurorOdds[] | undefined>(undefined);
  const [pnkStaked, setPnkStaked] = useState<number>(100000);
  const [nJurors, setNJurors] = useState<number>(3);
  const [pageSize, setPageSize] = useState<number>(10);
  const {data: pnkInfo} = useTokenInfo('kleros');

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
      let odds: JurorOdds[] = [];
      courts.forEach((court: Court) => {
        const voteStake = getVoteStake(court.minStake, court.alpha);
        const totalStaked = Number(ethers.utils.formatEther(court.tokenStaked as number));
        let extraValues = {
          stakeShare:  totalStaked ? pnkStaked / totalStaked: 0,
          odds: getOdds(totalStaked, pnkStaked, nJurors),
          voteStake: voteStake,
          rewardRisk: 0
        }
        odds.push(Object.assign({}, court, extraValues));
      })
      setOdds(odds);
    }
  }, [courts, pnkStaked, nJurors])

  const columns = [
    {
      field: 'id', headerName: 'Court #', flex: 1
    },
    {
      field: 'subcourtID', headerName: 'Court Name', flex: 2, renderCell: (params: GridRenderCellParams<BigNumberish>) => (
        <CourtLink chainId={chainId!} courtId={params.value! as string} />
      )
    },
    {
      field: 'activeJurors', headerName: 'Jurors', type: 'number', valueFormatter: (params: { value: BigNumberish }) => {
        return Number(params.value)
      }
    },
    {
      field: 'tokenStaked', headerName: 'Total Staked', flex: 1, valueFormatter: (params: { value: BigNumberish }) => {
        const valueFormatted = Number(ethers.utils.formatEther(params.value as number)).toLocaleString(undefined, { maximumFractionDigits: 0 });
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
      field: 'odds', headerName: 'Odds', valueFormatter: (params: { value: number }) => {
        const valueFormatted = Number(params.value * 100).toFixed(2);
        return `${valueFormatted} %`;
      }
    },
    {
      field: 'feeForJuror', headerName: 'Fee for Jurors', type:'number', flex: 1, valueFormatter: (params: { value: BigNumberish }) => {
        return formatAmount(params.value, chainId, true, true);
      }
    },
    {
      field: 'voteStake', headerName: 'Vote Stake', flex: 1, renderCell: (params: { row: { minStake: BigNumberish, alpha: BigNumberish } }) => {
        return (getVoteStake(params.row.minStake, params.row.alpha).toLocaleString() + ' PNK');
      }
    },
    { field: 'rewardRisk', headerName: 'Reward/Risk', flex: 1, renderCell: (params: { row: { voteStake: BigNumberish, feeForJuror: BigNumberish } }) => {
      return (getRewardRisk(params.row.feeForJuror, params.row.voteStake, pnkInfo?.current_price_eth).toFixed(3));
    }}
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
          <Typography>Search by Court #</Typography>
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
          ? `1 in ${odds[0].odds as number === 0? 0: (1/(odds[0].odds as number)).toFixed(0)} (${((odds[0].odds as number)* 100).toFixed(2)} %)`
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

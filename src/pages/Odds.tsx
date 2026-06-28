import { Box, Grid, Skeleton, TextField, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import Header from '../components/Header'
import DICE from '../assets/icons/dice_violet.png';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Court, JurorOdds } from '../graphql/subgraph';
import CourtLink from '../components/CourtLink';
import { useLocation } from 'react-router-dom';
import { formatAmount, getVoteStake } from '../lib/helpers';
import { useCourts } from '../hooks/useCourts';
import { BigNumberish } from '../lib/types';
import { formatEther } from 'viem';
import { MarketData, useTokenInfo } from '../hooks/useTokenInfo';



function getOdds(totalStaked: number, tokenStaked: number, nJurors: number): number {
  if (tokenStaked === 0) return 0;
  if (totalStaked === 0) return 0;
  if (nJurors === 0) return 0;      
  const p = tokenStaked/totalStaked
  const noDrawn = (1 - p)**nJurors
  return 1 - noDrawn

}

function getRewardRisk(feeForJuror: BigNumberish, voteStake: BigNumberish, pnkEth: MarketData|undefined, chainId: string): number {
  if (!pnkEth) return 0
  let pnkPrice : number
  if (chainId === '1') pnkPrice = pnkEth.current_price_eth
  else if (chainId === '100') pnkPrice = pnkEth.current_price
  else return 0

  return Number(formatEther(BigInt(String(feeForJuror)))) / (Number(voteStake) * (pnkPrice ?? 1)); 
}

const formStyle = {
  border: '1px solid #E5E5E5',
  borderRadius: '3px'
}

export default function Odds() {
  const location = useLocation();
  const match = location.pathname.match('(11155111|100|1)(?:/|$)')
  const chainId = match ? match[1] : null
  const [court, setCourt] = useState<string | undefined>(undefined);
  const [generalCourtOdds, setGeneralCourtOdds] = useState<string | undefined>(undefined);
  const { data: courts, isLoading } = useCourts({chainId:chainId!, subcourtID:court});
  const [odds, setOdds] = useState<JurorOdds[] | undefined>(undefined);
  const [pnkStaked, setPnkStaked] = useState<number>(100000);
  const [nJurors, setNJurors] = useState<number>(3);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
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
         const totalStaked = Number(formatEther(BigInt(String(court.tokenStaked as number))));
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
  
  useEffect(() => {
    if (generalCourtOdds === undefined) {
      // only update at the beggining of the load
      if (odds) {
        const oddString = `1 in ${odds[0].odds as number === 0? 0: (1/(odds[0].odds as number)).toFixed(0)} (${((odds[0].odds as number)* 100).toFixed(2)} %)`
        setGeneralCourtOdds(oddString);
      }
    }
  }, [odds, generalCourtOdds])

  const columns: GridColDef<JurorOdds>[] = [
    {
      field: 'id', headerName: 'Court #', flex: 1
    },
    {
      field: 'subcourtID', headerName: 'Court Name', flex: 2, renderCell: (params: GridRenderCellParams<JurorOdds>) => (
        <CourtLink chainId={chainId!} courtId={params.value as string} />
      )
    },
     {
       field: 'activeJurors', headerName: 'Jurors', type: 'number', valueFormatter: (value: any) => {
         return Number(value)
       }
     },
      {
        field: 'tokenStaked', headerName: 'Total Staked', flex: 1, valueFormatter: (value: any) => {
          const valueFormatted = Number(formatEther(BigInt(String(value as number)))).toLocaleString(undefined, { maximumFractionDigits: 0 });
          return `${valueFormatted}`;
        }
      },
     {
       field: 'stakeShare', headerName: 'Stake Share', flex: 1, valueFormatter: (value: any) => {
         const valueFormatted = Number(value * 100).toFixed(2);
         return `${valueFormatted} %`;
       }
     },
     {
       field: 'odds', headerName: 'Odds', valueFormatter: (value: any) => {
         const valueFormatted = Number(value * 100).toFixed(2);
         return `${valueFormatted} %`;
       }
     },
     {
       field: 'feeForJuror', headerName: 'Fee for Jurors', type:'number', flex: 1, valueFormatter: (value: any) => {
         return formatAmount(value, chainId!, true, true);
       }
     },
    {
      field: 'voteStake', headerName: 'Vote Stake', flex: 1, renderCell: (params: GridRenderCellParams<JurorOdds>) => {
        return (getVoteStake(params.row.minStake, params.row.alpha).toLocaleString() + ' PNK');
      }
    },
    { field: 'rewardRisk', headerName: 'Reward/Risk', flex: 1, renderCell: (params: GridRenderCellParams<JurorOdds>) => {
      return (getRewardRisk(params.row.feeForJuror, params.row.voteStake, pnkInfo, chainId!).toFixed(3));
    }}
  ];


  return (
    <div>
      <Header
        logo={DICE}
        title='Juror Odds'
        text='Check your chances to be drawn as a juror on Kleros Courts.'
      />
       <Grid container rowSpacing={4} sx={{ justifyContent: 'center' }}>
         {/* Search section */}
         <Grid size={{ sm: 6, md: 4 }}>
           <Typography>Search by Court #</Typography>
           <TextField id="outlined-basic" label="Search" variant="outlined" onChange={handleSetCourt} sx={formStyle} />
         </Grid>
         <Grid size={{ sm: 6, md: 4 }}>
           <Typography>PNK Staked</Typography>
           <TextField id="outlined-basic" value={pnkStaked} variant="outlined" onChange={handleSetPNKStaked} sx={formStyle} />
         </Grid>
         <Grid size={{ sm: 6, md: 4 }}>
           <Typography>Number of Jurors</Typography>
           <TextField id="outlined-basic" value={nJurors} variant="outlined" onChange={handleSetNJuror} sx={formStyle} />
         </Grid>
       </Grid>
      <Box sx={{ display: 'inline-flex', margin: '20px 0px 40px', alignItems: 'center' }}>
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
          generalCourtOdds
          ? generalCourtOdds
          : <Skeleton width={'40px'}/>}</Typography>
        </Box>

      {<DataGrid<JurorOdds>
         rows={odds ? odds! : []}
         columns={columns}
          paginationModel={paginationModel}
          loading={isLoading}
          onPaginationModelChange={(model) => setPaginationModel(model)}
         pageSizeOptions={[10, 50, 100]}
         disableRowSelectionOnClick
         autoHeight={true}
       />}

    </div >
  )
}

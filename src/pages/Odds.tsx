import { Grid } from '@mui/material'
import React, { useEffect, useState } from 'react'
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
  return tokenStaked / totalStaked
}


function getRewardRisk(feeForJuror: number, voteStake: number): number {
  // todo: convert feeForJuror to PNK or viceverza
  return feeForJuror / voteStake
}

export default function Odds() {
  let [searchParams] = useSearchParams();
  const chainId = getChainId(searchParams);
  const { data: courts, isLoading } = useCourts(chainId);
  const [odds, setOdds] = useState<JurorOdds[] | undefined>(undefined);
  const [pnkStaked, setPnkStaked] = useState<number>(100000);
  const [nJurors, setNJurors] = useState<number>(3);
  const [pageSize, setPageSize] = useState<number>(10);

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
      field: 'activeJurors', headerName: 'Jurors', flex: 1, type:'number',  valueFormatter: (params: { value: BigNumberish }) => {
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
      <Grid container rowSpacing={4}>
        {/* Search section */}
        <Grid item>

        </Grid>
      </Grid>

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

import React from 'react'
import Header from '../components/Header'
import BALANCE from '../assets/icons/balance_violet.png'
import ARROWUP from '../assets/icons/arrow_up_violet.png'
import ARROWDOWN from '../assets/icons/arrow_down_violet.png'
import { useCourt } from '../hooks/useCourt';
import { useParams } from 'react-router-dom';
import useCourtName from '../hooks/useCourtName';
import { Grid, Skeleton, Typography } from '@mui/material';
import CourtInfo from '../components/Court/CourtInfo'
import LatestDisputes from '../components/LatestDisputes'
import LatestStakes from '../components/LatestStakes'


export default function Court() {
  let { id, chainId } = useParams();
  const { data: court } = useCourt(chainId, id!)
  const courtName = useCourtName(chainId!, id!)

  return (
    <div>
      <Header
        logo={BALANCE}
        title={`Court #${id}: ${courtName}`}
        text="Breadcumbs"
      />

      <Grid container spacing={4} alignItems='center'>
        <Grid item display='inline-flex' alignItems='baseline'>
          <img src={ARROWUP} alt='arrow' height='16px' /><Typography>Court coherency:&nbsp;</Typography><Typography>{court ? `${court!.coherency} %` : <Skeleton variant='circular' />}</Typography>
        </Grid>
        <Grid item display='inline-flex' alignItems='baseline'>
          <img src={ARROWDOWN} alt='arrow' height='16px' /><Typography>Appealed cases:&nbsp;</Typography><Typography>{court ? `${court!.appealPercentage} %` : <Skeleton variant='circular' />}</Typography>
        </Grid>
      </Grid>

      {
        court ?
          <CourtInfo court={court} chainId={chainId!} />
          : <Skeleton height='200px' />
      }

      <Grid container spacing={2} style={{ marginTop: '40px' }}>

        <Grid item xs={12} md={6}>
          <LatestStakes chainId={chainId!} courtId={id}/>
        </Grid>


        <Grid item xs={12} md={6}>
          <LatestDisputes chainId={chainId!} courtId={id} courtRendering={true} />
        </Grid>

      </Grid>


    </div>
  )
}

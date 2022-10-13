import { Box, Grid, Skeleton } from '@mui/material'
import React from 'react'
import { Arbitrable } from '../../graphql/subgraph'
import StatCard from '../StatCard'
import BALANCE from '../../assets/icons_stats/balance_orange.png'
import ETHER from '../../assets/icons_stats/ethereum.png'
import { formatAmount } from '../../lib/helpers'
import { useTokenInfo } from '../../hooks/useTokenInfo'
import { DecimalBigNumber } from '../../lib/DecimalBigNumber'
import { BigNumber } from 'ethers'

interface Props {
    arbitrable: Arbitrable
    chainId: string
}

const dollarFormat = {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
}

export default function ArbitrableInfo(props: Props) {
    const {data: ethInfo} = useTokenInfo('ethereum');
  return (
    <Box sx={{
        background: '#FFFFFF',
        border: '1px solid #E5E5E5',
        boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.06)',
        borderRadius: '3px',
        padding: '10px'
    }}>
        <Grid container alignItems='center' justifyContent='start'>
        <Grid item>
            <StatCard title='Cases Created' value={props.arbitrable.disputesCount} subtitle={`${props.arbitrable.closedDisputes} closed`} image={BALANCE}/>
        </Grid>
        <Grid item>
            <StatCard title='Fees Generated' value={formatAmount(props.arbitrable.ethFees, props.chainId)} subtitle={ethInfo?(ethInfo.current_price*Number(new DecimalBigNumber(BigNumber.from(props.arbitrable.ethFees), 18))).toLocaleString(undefined, dollarFormat) + ' at current price':<Skeleton />} image={ETHER}/>
        </Grid>
        
        </Grid>
      
    </Box>
  )
}

import { Box, Grid, Skeleton } from '@mui/material';
import { cardStyle } from '../../lib/theme';
import React from 'react';
import { Arbitrable } from '../../graphql/subgraph';
import StatCard from '../StatCard';
import BALANCE from '../../assets/icons_stats/balance_orange.png';
import ETHER from '../../assets/icons_stats/ethereum.png';
import { formatAmount, getCurrency } from '../../lib/helpers';
import { useTokenInfo } from '../../hooks/useTokenInfo';
import { DecimalBigNumber } from '../../lib/DecimalBigNumber';

interface Props {
  arbitrable: Arbitrable;
  chainId: string;
}

const dollarFormat = {
  style: 'currency' as const,
  currency: 'USD',
  maximumFractionDigits: 2,
};

export default function ArbitrableInfo(props: Props) {
  const { data: ethInfo } = useTokenInfo(props.chainId === '100' ? 'dai' : 'ethereum');
  return (
    <Box
      sx={{
        ...cardStyle,
        padding: '10px',
      }}
    >
      <Grid container sx={{ alignItems: 'center', justifyContent: 'start' }}>
        <Grid>
          <StatCard
            title="Cases Created"
            value={props.arbitrable.disputesCount}
            subtitle={
              props.arbitrable.closedDisputes != null ? `${props.arbitrable.closedDisputes} already closed` : undefined
            }
            image={BALANCE}
          />
        </Grid>
        {props.arbitrable.ethFees != null && (
          <Grid>
            <StatCard
              title="Fees Generated"
              value={`${formatAmount(props.arbitrable.ethFees, props.chainId)} ${getCurrency(props.chainId)}`}
              subtitle={
                ethInfo ? (
                  (
                    ethInfo.current_price * Number(new DecimalBigNumber(BigInt(String(props.arbitrable.ethFees)), 18))
                  ).toLocaleString(undefined, dollarFormat) + ' at current price'
                ) : (
                  <Skeleton />
                )
              }
              image={ETHER}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

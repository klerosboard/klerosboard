import { Box, Divider, Grid, Skeleton, Typography, useMediaQuery, useTheme } from '@mui/material';
import { cardStyle } from '../../lib/theme';
import React from 'react';
import { Juror } from '../../graphql/subgraph';
import ETHER_STYLED from '../../assets/icons/ethereum_styled.png';
import PNK_STYLED from '../../assets/icons/pnk_styled.png';
import FIAT from '../../assets/icons/fiat.png';
import { formatAmount, formatPNK } from '../../lib/helpers';
import CoherenceGraph from './CoherenceGraph';
import { useTokenInfo } from '../../hooks/useTokenInfo';
import { formatEther } from 'viem';

const dollarFormat = {
  style: 'currency' as const,
  currency: 'USD',
  maximumFractionDigits: 2,
};

interface Props {
  profile: Juror;
  chainId: string;
}

const grayFont = {
  fontWeight: 400,
  fontSize: '14px',
  lineHeight: '19px',
  color: 'text.secondary',
};

export default function ProfileStats(props: Props) {
  const theme = useTheme();
  const breakpoint = useMediaQuery(theme.breakpoints.down('md'));
  const { data: ethInfo } = useTokenInfo(props.chainId === '100' ? 'dai' : 'ethereum');
  const { data: pnkInfo } = useTokenInfo('kleros');

  return (
    <Box
      sx={{
        ...cardStyle,
        padding: '10px',
      }}
    >
      <Grid container sx={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap' }}>
        {/* Left ~25%: pie chart + juror stats */}
        <Grid
          container
          size={{ xs: 12, md: 3 }}
          sx={{
            flexDirection: 'column',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '230px',
          }}
        >
          <Grid>
            <Typography>Juror in {props.profile.numberOfDisputesAsJuror} Cases</Typography>
          </Grid>
          <Grid container sx={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <Grid>
              <Typography sx={grayFont}>Coherency</Typography>
            </Grid>
            <Grid>
              <CoherenceGraph value={Number(props.profile.coherency)} />
            </Grid>
          </Grid>
          <Grid sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={grayFont}>Coherent Votes:&nbsp;</Typography>
            <Typography>
              {props.profile.numberOfCoherentVotes}/{props.profile.numberOfVotes}
            </Typography>
          </Grid>
        </Grid>

        <Divider orientation="vertical" flexItem={true} sx={breakpoint ? { display: 'none' } : null} />

        {/* Right ~75%: 3 equal sections */}
        <Grid container size={{ xs: 12, md: 9 }} sx={{ flexDirection: 'row', flexWrap: 'nowrap' }}>
          {/* Section 1: Juror Rewards (ETH + PNK) */}
          <Grid
            container
            size={4}
            sx={{
              flexDirection: 'column',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: '230px',
            }}
          >
            <Grid>
              <Typography sx={grayFont}>Juror Rewards</Typography>
            </Grid>
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
              <Grid>
                <img src={ETHER_STYLED} alt="ether logo" height="48px" />
              </Grid>
              <Grid>
                <Typography>{formatAmount(props.profile.ethRewards, props.chainId, true, true)}</Typography>
              </Grid>
              <Grid>
                <Typography sx={grayFont}>
                  {ethInfo ? (
                    (
                      ethInfo.current_price * Number(formatEther(BigInt(String(props.profile.ethRewards))))
                    ).toLocaleString(undefined, dollarFormat)
                  ) : (
                    <Skeleton />
                  )}
                </Typography>
              </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
              <Grid>
                <img src={PNK_STYLED} alt="pnk logo" height="48px" />
              </Grid>
              <Grid>
                <Typography>{formatPNK(props.profile.tokenRewards, true, true)}</Typography>
              </Grid>
              <Grid>
                <Typography sx={grayFont}>
                  {pnkInfo ? (
                    (
                      pnkInfo.current_price * Number(formatEther(BigInt(String(props.profile.tokenRewards))))
                    ).toLocaleString(undefined, dollarFormat)
                  ) : (
                    <Skeleton />
                  )}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Divider orientation="vertical" flexItem={true} sx={breakpoint ? { display: 'none' } : null} />

          {/* Section 2: Gas Cost for Voting */}
          {props.profile.totalGasCost != null && (
            <Grid
              container
              size={4}
              sx={{
                flexDirection: 'column',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: '230px',
              }}
            >
              <Grid>
                <Typography sx={grayFont}>Gas Cost for voting</Typography>
              </Grid>
              <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                <Grid>
                  <img src={ETHER_STYLED} alt="ether logo" height="48px" />
                </Grid>
                <Grid>
                  <Typography>{formatAmount(props.profile.totalGasCost, props.chainId, true, true)}</Typography>
                </Grid>
                <Grid>
                  <Typography sx={grayFont}>
                    {ethInfo ? (
                      (
                        ethInfo.current_price * Number(formatEther(BigInt(String(props.profile.totalGasCost))))
                      ).toLocaleString(undefined, dollarFormat)
                    ) : (
                      <Skeleton />
                    )}
                  </Typography>
                </Grid>
              </Grid>
              <Grid />
            </Grid>
          )}

          <Divider orientation="vertical" flexItem={true} sx={breakpoint ? { display: 'none' } : null} />

          {/* Section 3: Net Rewards */}
          {props.profile.ethRewards != null && props.profile.totalGasCost != null && (
            <Grid
              container
              size={4}
              sx={{
                flexDirection: 'column',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: '230px',
              }}
            >
              <Grid>
                <Typography sx={grayFont}>Net Rewards</Typography>
              </Grid>
              <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                <Grid>
                  <img src={FIAT} alt="fiat logo" height="48px" />
                </Grid>
                <Grid>
                  <Typography>
                    {ethInfo ? (
                      (
                        ethInfo.current_price *
                        (Number(formatEther(BigInt(String(props.profile.ethRewards)))) -
                          Number(formatEther(BigInt(String(props.profile.totalGasCost)))))
                      ).toLocaleString(undefined, dollarFormat)
                    ) : (
                      <Skeleton />
                    )}
                  </Typography>
                </Grid>
              </Grid>
              <Grid />
            </Grid>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

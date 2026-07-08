import React from 'react';
import BackgroundLight from '../assets/banners/header_ilustration.png';
import BackgroundDark from '../assets/banners/header_ilustration_dark.svg';
import { Box, Grid, Typography } from '@mui/material';
import { useThemeMode } from '../lib/ThemeModeContext';

export default function Header(props: { logo: string; title: string; text: string | React.ReactNode }) {
  const { mode } = useThemeMode();
  const Background = mode === 'dark' ? BackgroundDark : BackgroundLight;

  return (
    <Grid
      container
      sx={{
        backgroundImage: { xs: 'none', sm: `url(${Background})` },
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right',
        backgroundSize: 'auto 100%',
        width: '100%',
        height: { xs: 'auto', sm: '100px' },
        flexShrink: 0,
        marginBottom: { xs: '20px', sm: '40px' },
        justifyContent: 'start',
      }}
    >
      <Grid size={{ sm: 10 }} sx={{ display: 'inline-flex', alignItems: 'center' }}>
        <Box
          component="img"
          sx={{
            height: 24,
            marginRight: '20px',
          }}
          alt="Page logo"
          src={props.logo}
        />

        <Typography variant="h1" sx={{ color: 'text.primary' }}>
          {props.title}
        </Typography>
      </Grid>
      <Grid size={{ sm: 12 }}>
        {typeof props.text === 'string' ? (
          <Typography
            variant="body1"
            sx={{
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '16px',
              lineHeight: '22px',
              color: 'text.secondary',
            }}
          >
            {props.text}
          </Typography>
        ) : (
          props.text
        )}
      </Grid>
    </Grid>
  );
}

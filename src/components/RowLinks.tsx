import React from 'react';
import { Grid, Typography } from '@mui/material';
import { cardStyle } from '../lib/theme';

import DISCORD from '../assets/icons_social_media/discord.png';
import GITHUB from '../assets/icons_social_media/github.png';
import SNAPSHOT from '../assets/icons_social_media/snapshot.png';
import TELEGRAM from '../assets/icons_social_media/telegram.png';
import WEB from '../assets/icons_social_media/web.png';
import YOUTUBE from '../assets/icons_social_media/youtube.png';
import TWITTER from '../assets/icons_social_media/twitter.png';

const img = {
  width: '16px',
  // height: '12px',
  marginRight: '6px',
};
export default function RowLinks() {
  return (
    <div>
      <Grid
        container
        sx={{
          width: '100%',
          justifyContent: 'space-between',
          alignItems: 'center',
          ...cardStyle,
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            width: '5px',
            height: '64px',
            background: '#9013FE',
            borderRadius: '3px 0 0 3px',
          }}
        ></div>
        <Grid size="grow" sx={{ display: 'inline-flex', paddingLeft: '16px' }}>
          <Typography>Kleros</Typography>
          <Typography>Links</Typography>
        </Grid>
        <Grid
          size="auto"
          sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginRight: '30px' }}
        >
          <a href="https://kleros.io" target="_blank" rel="noreferrer">
            <img src={WEB} style={img} alt="Web" />
          </a>
          <a href="https://github.com/kleros" target="_blank" rel="noreferrer">
            <img src={GITHUB} style={img} alt="Github" />
          </a>
          <a href="https://snapshot.org/#/kleros.eth/" target="_blank" rel="noreferrer">
            <img src={SNAPSHOT} style={img} alt="Snapshot" />
          </a>
          <a href="https://discord.gg/wQJTnmCZFs" target="_blank" rel="noreferrer">
            <img src={DISCORD} style={img} alt="Discord" />
          </a>
          <a href="https://twitter.com/kleros_io" target="_blank" rel="noreferrer">
            <img src={TWITTER} style={img} alt="Twitter" />
          </a>
          <a href="https://www.youtube.com/channel/UCEjwygFVVrSXhPNEKfweypA" target="_blank" rel="noreferrer">
            <img src={YOUTUBE} style={img} alt="Youtube" />
          </a>
          <a href="https://t.me/kleros" target="_blank" rel="noreferrer">
            <img src={TELEGRAM} style={img} alt="Telegram" />
          </a>
        </Grid>
      </Grid>

      <Grid
        container
        sx={{
          width: '100%',
          justifyContent: 'space-between',
          alignItems: 'center',
          ...cardStyle,
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            width: '5px',
            height: '64px',
            background: '#FF9900',
            borderRadius: '3px 0 0 3px',
          }}
        ></div>
        <Grid size="grow" sx={{ display: 'inline-flex', paddingLeft: '16px' }}>
          <Typography>Proof of Humanity</Typography>
          <Typography>Links</Typography>
        </Grid>
        <Grid
          size="auto"
          sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginRight: '30px' }}
        >
          <a href="https://proofofhumanity.id" target="_blank" rel="noreferrer">
            <img src={WEB} style={img} alt="Web" />
          </a>
          <a href="https://github.com/proof-Of-Humanity/" target="_blank" rel="noreferrer">
            <img src={GITHUB} style={img} alt="Github" />
          </a>
          <a href="https://snapshot.org/#/kleros.eth/" target="_blank" rel="noreferrer">
            <img src={SNAPSHOT} style={img} alt="Snapshot" />
          </a>
          <a href="https://twitter.com/proofofhumanity" target="_blank" rel="noreferrer">
            <img src={TWITTER} style={img} alt="Twitter" />
          </a>
          <a href="https://t.me/proofofhumanity" target="_blank" rel="noreferrer">
            <img src={TELEGRAM} style={img} alt="Telegram" />
          </a>
        </Grid>
      </Grid>
    </div>
  );
}

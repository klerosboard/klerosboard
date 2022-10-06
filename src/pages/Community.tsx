import React from 'react'

import Header from '../components/Header';
import { Box, Grid, Typography } from '@mui/material';

import COMMUNITY from '../assets/icons/community_violet.png';
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
  marginRight: '6px'
}
export default function Community() {
  return (
    <div>
      <Header
        logo={COMMUNITY}
        title='Kleros Family'
        text='Join the community map and be part of Kleros Family.'
      />

      {/* Todo: add the map  */}



      <Grid container justifyContent='space-between' display='inline-flex' alignItems='center'
        style={{
          border: '1px solid #E5E5E5',
          boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.06)',
          borderRadius: '3px'
        }}>
        <div style={{
          width: '5px',
          height: '64px',
          background: '#9013FE'
        }}>
        </div>
        <Grid item xs={11} sm={7} display={'inline-flex'}><Typography>Kleros</Typography><Typography>Links</Typography></Grid>
        <Grid item xs={11} sm={4} display='inherit' justifyContent='end' sx={{ marginRight: '30px' }}>
          <a href='https://kleros.io' target="_blank" rel="noreferrer"><img src={WEB} style={img} alt='Web' /></a>
          <a href='https://github.com/kleros' target="_blank" rel="noreferrer"><img src={GITHUB} style={img} alt='Github' /></a>
          <a href='https://snapshot.org/#/kleros.eth/' target="_blank" rel="noreferrer"><img src={SNAPSHOT} style={img} alt='Snapshot' /></a>
          <a href='https://discord.gg/wQJTnmCZFs' target="_blank" rel="noreferrer"><img src={DISCORD} style={img} alt='Discord' /></a>
          <a href='https://twitter.com/kleros_io' target="_blank" rel="noreferrer"><img src={TWITTER} style={img} alt='Twitter' /></a>
          <a href='https://www.youtube.com/channel/UCEjwygFVVrSXhPNEKfweypA' target="_blank" rel="noreferrer"><img src={YOUTUBE} style={img} alt='Youtube' /></a>
          <a href='https://t.me/kleros' target="_blank" rel="noreferrer"><img src={TELEGRAM} style={img} alt='Telegram' /></a>
        </Grid>
      </Grid>


      <Grid container justifyContent='space-between' display='inline-flex' alignItems='center'
        style={{
          border: '1px solid #E5E5E5',
          boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.06)',
          borderRadius: '3px'
        }}>
        <div style={{
          width: '5px',
          height: '64px',
          background: '#FF9900'
        }}>
        </div>
        <Grid item xs={11} sm={7} display={'inline-flex'}><Typography>Proof of Humanity</Typography><Typography>Links</Typography></Grid>
        <Grid item xs={11} sm={4} display='inherit' justifyContent='end' sx={{ marginRight: '30px' }}>
          <a href='https://proofofhumanity.id' target="_blank" rel="noreferrer"><img src={WEB} style={img} alt='Web' /></a>
          <a href='https://github.com/proof-Of-Humanity/' target="_blank" rel="noreferrer"><img src={GITHUB} style={img} alt='Github' /></a>
          <a href='https://snapshot.org/#/kleros.eth/' target="_blank" rel="noreferrer"><img src={SNAPSHOT} style={img} alt='Snapshot' /></a>
          <a href='https://twitter.com/proofofhumanity' target="_blank" rel="noreferrer"><img src={TWITTER} style={img} alt='Twitter' /></a>
          <a href='https://t.me/proofofhumanity' target="_blank" rel="noreferrer"><img src={TELEGRAM} style={img} alt='Telegram' /></a>
        </Grid>
        
      </Grid>

    </div>
  )
}

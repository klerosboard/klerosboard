import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { CardMedia, Grid } from '@mui/material';
import { BigNumberish } from 'ethers';

const valueCSS = {
  fontSize: '24px',
  fontWeight: 600,
  lineHeight: '33px',
  fontStyle: 'normal',
  color: '#333333'
}

const titleCSS = {
  fontSize: '14px',
  fontWeight: 400,
  lineHeight: '19px',
  fontStyle: 'normal',
  color: 'text.secondary'
}

const subTitleCSS = {
  fontSize: '12px',
  fontWeight: 400,
  lineHeight: '19px',
  fontStyle: 'normal',
  color: 'text.secondary'
}


export default function StatCard({ title, value, subtitle, image }: { title: string, value: string | undefined | BigNumberish, subtitle: string, image: string }) {
  return (
    <Card sx={{ minWidth: 190, height: 130, border: 'none', boxShadow: 'none', overflow: 'clip' }}>
      <Grid container spacing={0} justifyContent={"center"} >
        <Grid 
          item xs={3}
          sx={{ alignContent: 'center', justifyContent: "right", display: 'inline-grid' }}
          >
          <CardMedia
            component="img"
            alt="card logo"
            sx={{ width: '48px', height: '48px' }}
            image={image}
          />
        </Grid>


        <Grid item xs={9} padding='0px'>
          <CardContent>
            <Typography sx={titleCSS} gutterBottom>
              {title}
            </Typography>
            <Typography component="div" sx={valueCSS}>
              {value}
            </Typography>
            <Typography sx={subTitleCSS} gutterBottom>
              {subtitle}
            </Typography>
          </CardContent>
        </Grid>
      </Grid>
    </Card>
  );
}
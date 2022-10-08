import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { CardMedia, Grid } from '@mui/material';
import { BigNumberish } from 'ethers';

export default function StatCard({ title, value, subtitle, image }: { title: string, value: string | undefined | BigNumberish, subtitle: string, image: string }) {
  return (
    <Card sx={{ minWidth: 275, height: 130, border: 'none', boxShadow: 'none' }}>
      <Grid container spacing={0} justifyContent={"center"} justifyItems={'center'}>
        <Grid 
          item xs={3} direction="row"
          sx={{ alignContent: 'center', justifyContent: "right", display: 'inline-grid' }}
          >
          <CardMedia
            component="img"
            alt="card logo"
            sx={{ width: '48px', height: '48px' }}
            image={image}
          />
        </Grid>


        <Grid item xs={9} direction="row" >
          <CardContent>
            <Typography sx={{ fontSize: 14, fontWeight: 400, lineHeight: '19px'}} color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography component="div" sx={{fontSize: 24, fontWeight: 600, lineHeight: '33px'}}>
              {value}
            </Typography>
            <Typography sx={{ mb: 1.5, fontSize: 12, fontWeight: 400, lineHeight: '19px'}} color="text.secondary">
              {subtitle}
            </Typography>
          </CardContent>
        </Grid>
      </Grid>
    </Card>
  );
}
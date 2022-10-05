import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { CardMedia, Grid } from '@mui/material';

export default function BasicCard({ title, value, subtitle, image }: { title: string, value: string, subtitle: string, image: string }) {
  return (
    <Card sx={{ minWidth: 275, height: 130, border: 'none', boxShadow: 'none' }}>
      <Grid container spacing={0} justifyContent={"center"} justifyItems={'center'}>
        <Grid 
          item xs={4} direction="row"
          sx={{ alignContent: 'center', justifyContent: "center", display: 'inline-grid  ' }}
          >
          <CardMedia
            component="img"
            alt="card logo"
            sx={{ width: '48px', height: '48px', justifyContent: 'center' }}
            image={image}
          />
        </Grid>


        <Grid item xs={8} direction="row" >
          <CardContent>
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h5" component="div">
              {value}
            </Typography>
            <Typography sx={{ mb: 1.5, fontSize: 12}} color="text.secondary">
              {subtitle}
            </Typography>
          </CardContent>
        </Grid>
      </Grid>
    </Card>
  );
}
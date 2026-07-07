import React from 'react';
import Header from '../components/Header';
import UNION from '../assets/icons/union_violet.png';
import { Grid, Typography } from '@mui/material';
import RowLinks from '../components/RowLinks';
import CURATE from '../assets/icons_kleros/curate.png';
import ESCROW from '../assets/icons_kleros/escrow.png';
import GOVERNOR from '../assets/icons_kleros/governor.png';
import COURT from '../assets/icons_kleros/kleros.png';
import COURT_V2 from '../assets/icons_kleros/court-v2.png';
import POH from '../assets/icons_kleros/poh.png';
import RESOLVER from '../assets/icons_kleros/resolver.png';
import SCOUT from '../assets/icons_kleros/scout.png';

function SolutionCard({ img, text, href }: { img: string; text: string; href?: string }) {
  return (
    <Grid
      size={{ xs: 6, sm: 3, md: 'grow' }}
      sx={{ height: '172px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
    >
      <a href={href ? href : '/#'} target="_blank" rel="noreferrer">
        <img src={img} alt={text} />
      </a>
      <Typography>{text}</Typography>
    </Grid>
  );
}

export default function Solutions() {
  return (
    <div>
      <Header logo={UNION} title="Kleros Solutions" text="A list of Kleros Solutions and official links" />
      <Grid container spacing={2} sx={{ width: '100%', alignItems: 'stretch' }}>
        <SolutionCard img={COURT} text="Court" href="https://court.kleros.io" />
        <SolutionCard img={COURT_V2} text="Court V2" href="https://v2.kleros.builders" />
        <SolutionCard img={ESCROW} text="Escrow" href="https://escrow.kleros.io" />
        <SolutionCard img={SCOUT} text="Scout" href="https://scout.kleros.io" />
        <SolutionCard img={POH} text="POH" href="https://proofofhumanity.id" />
        <SolutionCard img={CURATE} text="Curate" href="https://curate.kleros.io" />
        <SolutionCard img={RESOLVER} text="Resolver" href="https://resolve.kleros.io" />
        <SolutionCard img={COURT} text="Enterprise" href="https://kleros.io/enterprise" />
        <SolutionCard img={GOVERNOR} text="Governor" href="https://governor.kleros.io" />
      </Grid>

      <RowLinks />
    </div>
  );
}

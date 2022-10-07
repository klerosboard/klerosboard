import React from 'react'
import Header from '../components/Header'
import UNION from '../assets/icons/union_violet.png';
import { Grid, Typography } from '@mui/material';
import RowLinks from '../components/RowLinks';
import CURATE from '../assets/icons_kleros/curate.png';
import ESCROW from '../assets/icons_kleros/escrow.png';
import GOVERNOR from '../assets/icons_kleros/governor.png';
import COURT from '../assets/icons_kleros/kleros.png';
import LINGUO from '../assets/icons_kleros/linguo.png';
import POH from '../assets/icons_kleros/poh.png';
import RESOLVER from '../assets/icons_kleros/resolver.png';
import TOKENS from '../assets/icons_kleros/tokens.png';

function SolutionCard({ img, text, href }: { img: string, text: string, href?: string }) {
  console.log(href)
  return (
    <Grid container item xs={4} md={1}
      height='172px' alignItems='center' justifyContent={'center'}
      display='flex' direction='column'>
      <a href={href ? href : '/#'} target='_blank' rel="noreferrer"><img src={img} alt={text} /></a>
      <Typography>{text}</Typography>
    </Grid>
  )
}

export default function Solutions() {
  return (
    <div>
      <Header
        logo={UNION}
        title='Kleros Solutions'
        text='A list of Kleros Solutions and official links' />
      <Grid container spacing={2} justifyContent='space-between' alignItems='center'
        marginTop={'-40px'}>
        <SolutionCard img={COURT} text='Court' href='https://court.kleros.io' />
        <SolutionCard img={ESCROW} text='Escrow' href='https://escrow.kleros.io' />
        <SolutionCard img={TOKENS} text='Tokens' href='https://tokens.kleros.io'  />
        <SolutionCard img={POH} text='POH' href='https://proofofhumanity.id'  />
        <SolutionCard img={CURATE} text='Curate' href='https://curate.kleros.io'  />
        <SolutionCard img={RESOLVER} text='Resolver' href='https://resolve.kleros.io'  />
        <SolutionCard img={LINGUO} text='Linguo' href='https://linguo.kleros.io'  />
        <SolutionCard img={GOVERNOR} text='Governor' href='https://governor.kleros.io'  />
      </Grid>

      <RowLinks />
    </div>
  )
}

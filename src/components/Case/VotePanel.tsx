import * as React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Vote } from '../../graphql/subgraph';
import JurorLink from '../JurorLink';
import { formatDate, voteMapping } from '../../lib/helpers';
import { Grid, List, ListItem } from '@mui/material';
import { MetaEvidence } from '../../lib/types';

interface Props {
  chainId: string
  vote: Vote
  metaEvidence?: MetaEvidence
}


const justificationStyle = {
  fontFamily: 'Open Sans',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: '16px',
  lineHeight: '22px',
  color: '#333333',
}

const voteStyle = {
  fontFamily: 'Open Sans',
  fontStyle: 'normal',
  fontWeight: 600,
  fontSize: '16px',
  lineHeight: '22px',
  color: 'rgba(0, 0, 0, 0.85)',
}

export default function VotePanel(props: Props) {
  const voteChoice = voteMapping(props.vote.choice, props.vote.voted, props.metaEvidence?props.metaEvidence.metaEvidenceJSON.rulingOptions.titles: undefined);
  return (
    <Accordion
      sx={{
        width: '100%',
        background: '#FFFFFF',
        border: '1px solid #E5E5E5',
        boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.06)',
        borderRadius: '3px',
        margin: '5px 0px'
      }}
      key={`accordion-${props.vote.id}`}
      >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        <Grid container sx={{margin:'0px 10px'}}>
          <Grid item xs={12} md={3}>
            <JurorLink address={props.vote.address.id} chainId={props.chainId}/></Grid>
          <Grid item>
            <Typography sx={justificationStyle}> {voteChoice}</Typography>
          </Grid>
        </Grid>
      </AccordionSummary>
      <AccordionDetails>
        <List dense={true}>
          <ListItem key={`vote-${props.vote.id}`}>
            <Typography>Vote:  </Typography><Typography sx={voteStyle}>{voteChoice} </Typography>
          </ListItem>
          {/* <ListItem>
            <Typography>Justification:   </Typography><Typography sx={justificationStyle}>Soon...</Typography>
          </ListItem> */}
          <ListItem key={`date-${props.vote.id}`}>
            <Typography>Date:    </Typography>
            <Typography sx={voteStyle}>{props.vote.timestamp ? formatDate(props.vote.timestamp as number): null}</Typography>
          </ListItem>
        </List>
      </AccordionDetails>
    </Accordion >
  );
}
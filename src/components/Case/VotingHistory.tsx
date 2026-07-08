import * as React from 'react';
import { cardStyle } from '../../lib/theme';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Round } from '../../graphql/subgraph';
import RoundPanel from './RoundPanel';
import { BigNumberish } from '../../lib/types';
import { MetaEvidence } from '../../lib/types';

interface Props {
  rounds: Round[];
  disputeId: BigNumberish;
  chainId: string;
  metaEvidence?: MetaEvidence;
  isDynamicScriptLoading?: boolean;
  hiddenVotes: boolean;
  period: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`TabPanel-${index}`} aria-labelledby={`${index}`} {...other}>
      {value === index && children}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `Tab-${index}`,
    'aria-controls': `${index}`,
  };
}

export default function VotingHistory(props: Props) {
  const [value, setValue] = React.useState(Math.max(0, props.rounds.length - 1));

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box
      sx={{
        width: '100%',
        margin: '20px 0px',
        ...cardStyle,
        padding: '10px',
      }}
    >
      <Typography variant="h1" sx={{ mb: 2 }}>
        Voting History
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          {props.rounds.map((_, index) => {
            return <Tab label={`Round ${index}`} key={`TabsRound-${index}`} {...a11yProps(index)} />;
          })}
        </Tabs>
      </Box>
      {props.rounds.map((round, index) => {
        return (
          <TabPanel value={value} index={index} key={`TabPanel-${index}`}>
            <RoundPanel
              disputeId={props.disputeId}
              votes={round.votes}
              chainId={props.chainId}
              roundId={round.id}
              metaEvidence={props.metaEvidence}
              isDynamicScriptLoading={props.isDynamicScriptLoading}
              hiddenVotes={props.hiddenVotes}
              period={props.period}
            />
          </TabPanel>
        );
      })}
    </Box>
  );
}

import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Round } from '../../graphql/subgraph';
import RoundPanel from './RoundPanel';
import { BigNumberish } from 'ethers';

interface Props {
    rounds: Round[]
    disptueId: BigNumberish
    chainId: string
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`TabPanel-${index}`}
            aria-labelledby={`${index}`}
            {...other}
        >
            {value === index && (
                children
            )}
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
    const [value, setValue] = React.useState(props.rounds.length - 1);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                    {
                        props.rounds.map((_, index) => {
                            return <Tab label={`Round ${index}`} {...a11yProps(index)} />
                        })
                    }
                </Tabs>
            </Box>
            {
                props.rounds.map((round, index) => {
                    return (
                        <TabPanel value={value} index={index}>
                            <RoundPanel disputeId={props.disptueId} votes={round.votes} chainId={props.chainId} roundId={round.id}/>
                        </TabPanel>
                    )
                })
            }
        </Box>
    );
}
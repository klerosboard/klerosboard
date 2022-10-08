import React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import { Court } from '../../graphql/subgraph';
import { intervalToDuration } from 'date-fns'
import formatDuration from 'date-fns/formatDuration'
import { BigNumberish } from 'ethers';
import { getPeriodNumber, getTimeLeft } from '../../lib/helpers';
import { useI18nContext } from '../../lib/I18nContext';

interface Props {
  currentPeriod: string
  court: Court
  lastPeriodChange: BigNumberish
}

function formatPeriod(timePeriod: BigNumberish): string {
  return formatDuration(intervalToDuration({ start: 0, end: Number(timePeriod) * 1000 }))
}

export default function PeriodStatus(props: Props) {
  const { locale } = useI18nContext();

  const period = getPeriodNumber(props.currentPeriod)
  const periodSpan = props.court.timePeriods[period];
  // because hidden vote its optional according to the court parameters.
  const offsetPeriod = props.court.hiddenVotes ? 0 : period > 1 ? 1 : 0;

  return (
    <Box sx={{
      width: '100%', margin: '20px 0px', background: '#FFFFFF',
      padding: '10px',
      border: '1px solid #E5E5E5',
      /* Card Drop Shadow */
      boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.06)',
      borderRadius: '3px',
    }}>
      <Stepper activeStep={getPeriodNumber(props.currentPeriod) - offsetPeriod}>
        <Step key='evidence' completed={period > 0}>
          <StepLabel optional={formatPeriod(props.court.timePeriods[0])}><Typography>Evidence Period</Typography></StepLabel>
        </Step>
        {props.court.hiddenVotes ?
          <Step key='commit' completed={period > 1}>
            <StepLabel optional={formatPeriod(props.court.timePeriods[1])}><Typography>Commit Period</Typography></StepLabel>
          </Step>
          : null
        }
        <Step key='voting' completed={period > 2}>
          <StepLabel optional={formatPeriod(props.court.timePeriods[2])}><Typography>Voting Period</Typography></StepLabel>
        </Step>
        <Step key='appeal' completed={period > 3}>
          <StepLabel optional={formatPeriod(props.court.timePeriods[3])}><Typography>Appeal Period</Typography></StepLabel>
        </Step>
        <Step key='execution' completed={period === 4}>
          <StepLabel optional='Final Decision'><Typography>Enforcement</Typography></StepLabel>
        </Step>

      </Stepper>
      {
        period !== 4 ?
          <Typography sx={{
            fontStyle: 'normal',
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '22px',
            color: '#666666'
          }}>Time left in this period: {getTimeLeft(Number(props.lastPeriodChange) + Number(periodSpan), false, locale)}</Typography>
          : null
      }
    </Box>
  );
}
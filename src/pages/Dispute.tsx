import React from 'react'
import { useParams, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import { useDispute } from '../hooks/useDispute'
import { getChainId } from '../lib/helpers';
import GAVEL from '../assets/icons/gavel_violet.png'
import PeriodStatus from '../components/PeriodStatus';
import { Court } from '../graphql/subgraph';
import { Box, Skeleton } from '@mui/material';
import CaseInfo from '../components/Cases/CaseInfo';
import VotingHistory from '../components/Cases/VotingHistory';

export default function Dispute() {
  let [searchParams] = useSearchParams();
  const chainId = getChainId(searchParams)
  let { id } = useParams();
  const { data } = useDispute(chainId, id!)

  return (
    <div>
      <Header
        logo={GAVEL}
        title={`Case #${id}`}
        text="Check the case specific data, case's creator, status and voting history"
      />
      {/* Case period */}
      {
        data !== undefined ?
          <Box sx={{
            background: '#FFFFFF',
            padding: '10px',
            border: '1px solid #E5E5E5',
            /* Card Drop Shadow */
            boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.06)',
            borderRadius: '3px'
          }} >
            <PeriodStatus court={data.subcourtID as Court} currentPeriod={data.period}
              lastPeriodChange={data.lastPeriodChange} showTimeLeft={true} />
          </Box>
          : <Skeleton width={'100%'} height='100px' />
      }

      {/* Case Information */}
      {
        data !== undefined ?
          <CaseInfo
            id={id!} chainId={chainId}
            arbitrableId={data!.arbitrable.id}
            creatorId={data!.creator.id}
            courtId={data!.subcourtID.id}
            roundNum={data!.rounds.length}
            startTimestamp={data!.startTime}
          />
          : <Skeleton width={'100%'} height='200px' />
      }

      {/* Case Information */}
      {
        data !== undefined ?
          <VotingHistory rounds={data.rounds} disptueId={data.id} chainId={chainId} />
          : <Skeleton width={'100%'} height='200px' />
      }




    </div>
  )
}

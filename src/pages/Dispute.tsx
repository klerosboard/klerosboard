import React from 'react'
import { useParams, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import { useDispute } from '../hooks/useDispute'
import { getChainId, getPeriodNumber } from '../lib/helpers';
import GAVEL from '../assets/icons/gavel_violet.png'
import PeriodStatus from '../components/Cases/PeriodStatus';
import { Court } from '../graphql/subgraph';
import { Skeleton } from '@mui/material';
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
          <PeriodStatus court={data.subcourtID as Court} currentPeriod={data.period}
            lastPeriodChange={data.lastPeriodChange} />
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

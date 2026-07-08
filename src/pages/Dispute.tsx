import React from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import { useDispute } from '../hooks/useDispute';
import { useChainId } from '../hooks/useChainId';
import GAVEL from '../assets/icons/gavel_violet.png';
import PeriodStatus from '../components/PeriodStatus';
import { Court } from '../graphql/subgraph';
import { DisputeWithV2Meta } from '../hooks/v2/useDisputeV2';
import { Box, Grid, Skeleton, Typography } from '@mui/material';
import CaseInfo from '../components/Case/CaseInfo';
import VotingHistory from '../components/Case/VotingHistory';
import { useMetaEvidence } from '../hooks/useMetaEvidence';
import { useEvidence } from '../hooks/useEvidence';
import EvidenceCard from '../components/EvidenceCard';
import { cardStyle } from '../lib/theme';

export default function Dispute() {
  const { id } = useParams();
  const chainId = useChainId();

  const { data } = useDispute(chainId!, id!);
  const templateId = (data as DisputeWithV2Meta | undefined)?.templateId;
  const { metaEvidence, isDynamicScriptLoading, error } = useMetaEvidence(
    chainId!,
    data ? data.arbitrable.id : undefined,
    id!,
    templateId,
  );
  const { evidences, error: errorEvidence } = useEvidence(chainId!, id!);
  const exportData = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `dispute${data?.id}.json`;

    link.click();
  };

  return (
    <div>
      <Header
        logo={GAVEL}
        title={`Case #${id}`}
        text="Check the case specific data, case's creator, status and voting history"
      />
      {/* Case period */}
      {data !== undefined ? (
        <Grid container sx={{ width: '100%' }}>
          <Grid size={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link onClick={exportData} to={'#'}>
              Download JSON file
            </Link>
          </Grid>
          <Grid
            size={12}
            sx={{
              ...cardStyle,
              padding: '10px',
            }}
          >
            <PeriodStatus
              court={data.subcourtID as Court}
              currentPeriod={data.period}
              lastPeriodChange={data.lastPeriodChange}
              showTimeLeft={true}
            />
          </Grid>
        </Grid>
      ) : (
        <Skeleton width={'100%'} height="100px" />
      )}

      {/* Case Information */}
      {data !== undefined && (metaEvidence || error) ? (
        <CaseInfo
          id={id!}
          chainId={chainId!}
          arbitrableId={data!.arbitrable.id}
          creatorId={data!.creator?.id ?? ''}
          courtId={data!.subcourtID.id}
          roundNum={data!.rounds.length}
          startTimestamp={data!.startTime}
          metaEvidence={metaEvidence}
          isDynamicScriptLoading={isDynamicScriptLoading}
        />
      ) : (
        <Skeleton width={'100%'} height="200px" />
      )}

      {/* Voting History */}
      {data !== undefined && (metaEvidence || error) ? (
        <VotingHistory
          rounds={data.rounds}
          disputeId={data.id}
          chainId={chainId!}
          metaEvidence={metaEvidence}
          isDynamicScriptLoading={isDynamicScriptLoading}
          hiddenVotes={!!(data.subcourtID as Court).hiddenVotes}
          period={data.period}
        />
      ) : (
        <Skeleton width={'100%'} height="200px" />
      )}

      {/* Evidence of the dispute */}
      {data !== undefined && (evidences || errorEvidence) ? (
        <Box
          sx={{
            width: '100%',
            margin: '20px 0px',
            ...cardStyle,
            padding: '10px',
          }}
        >
          <Typography variant="h1" sx={{ mb: 2 }}>
            Evidence
          </Typography>
          {errorEvidence ? (
            <>
              <Typography>Error trying to read the evidence of the dispute, please refresh the page.</Typography>
              <Typography>{errorEvidence}</Typography>
            </>
          ) : evidences!.length === 0 ? (
            <Typography>There is no evidence yet</Typography>
          ) : (
            evidences!
              .filter((evidence) => {
                // filter invalid evidence, such us in case 554
                if (evidence.evidenceJSON) {
                  return evidence;
                }
              })
              .map((evidence, index) => {
                return (
                  <div key={index}>
                    <EvidenceCard evidence={evidence} />
                  </div>
                );
              })
          )}
        </Box>
      ) : (
        <Skeleton width={'100%'} height="200px" />
      )}
    </div>
  );
}

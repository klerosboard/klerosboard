import React from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../components/Header";
import { useDispute } from "../hooks/useDispute";
import GAVEL from "../assets/icons/gavel_violet.png";
import PeriodStatus from "../components/PeriodStatus";
import { Court } from "../graphql/subgraph";
import { Box, Grid, Skeleton } from "@mui/material";
import CaseInfo from "../components/Case/CaseInfo";
import VotingHistory from "../components/Case/VotingHistory";
import { useMetaEvidence } from "../hooks/useMetaEvidence";
import { useEvidence } from "../hooks/useEvidence";
import EvidenceCard from "../components/EvidenceCard";

export default function Dispute() {
  let { id, chainId } = useParams();
  const { data } = useDispute(chainId, id!);
  const { metaEvidence, error } = useMetaEvidence(
    chainId,
    data ? data.arbitrable.id : undefined,
    id!
  );
  const { evidences, error: errorEvidence } = useEvidence(
    chainId,
    data ? data.arbitrable.id : undefined,
    id!
  );
  const exportData = () => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify(data)
    )}`;
    const link = document.createElement("a");
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
        <Grid container>
          <Grid
            item
            display={"flex-inline"}
            marginLeft={"auto"}
            sm={12}
            textAlign={"right"}
          >
            <Link onClick={exportData} to={"#"}>
              Download JSON file
            </Link>
          </Grid>
          <Grid
            item
            sm={12}
            sx={{
              background: "#FFFFFF",
              padding: "10px",
              border: "1px solid #E5E5E5",
              /* Card Drop Shadow */
              boxShadow: "0px 2px 3px rgba(0, 0, 0, 0.06)",
              borderRadius: "3px",
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
        <Skeleton width={"100%"} height="100px" />
      )}

      {/* Case Information */}
      {data !== undefined && (metaEvidence || error) ? (
        <CaseInfo
          id={id!}
          chainId={chainId!}
          arbitrableId={data!.arbitrable.id}
          creatorId={data!.creator.id}
          courtId={data!.subcourtID.id}
          roundNum={data!.rounds.length}
          startTimestamp={data!.startTime}
          metaEvidence={metaEvidence}
        />
      ) : (
        <Skeleton width={"100%"} height="200px" />
      )}

      {/* Voting History */}
      {data !== undefined && (metaEvidence || error) ? (
        <VotingHistory
          rounds={data.rounds}
          disptueId={data.id}
          chainId={chainId!}
          metaEvidence={metaEvidence}
        />
      ) : (
        <Skeleton width={"100%"} height="200px" />
      )}

      {/* Evidence of the dispute */}
      <Box sx={{
            width: '100%', margin: '20px 0px', background: '#FFFFFF',
            padding: '10px',
            border: '1px solid #E5E5E5',
            /* Card Drop Shadow */
            boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.06)',
            borderRadius: '3px',
        }}>
      <h3>Evidence</h3>
      {data !== undefined && (evidences || errorEvidence) ? (
        errorEvidence ? (
          <>
            <div>
              Error trying to read the evidence of the dispute, please refresh
              the page.
            </div>
            <div>{errorEvidence}</div>
          </>
        ) : (
          <div>
            {evidences!.length === 0 ? (
              <div>There is no evidence yet</div>
            ) : (
              evidences!.map((evidence, index) => {
                return (
                  <div key={index}>
                  <EvidenceCard evidence={evidence} />
                  </div>
                );
              })
            )}
          </div>
        )
      ) : (
        <Skeleton width={"100%"} height="200px" />
      )}
      </Box>
    </div>
  );
}

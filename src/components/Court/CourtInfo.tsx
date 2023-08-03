import { Box, Grid, Skeleton, Typography } from "@mui/material";
import React, { useState } from "react";
import { Court } from "../../graphql/subgraph";
import PeriodStatus from "../PeriodStatus";
import COMMUNITY from "../../assets/icons/community_violet.png";
import HOURGLASS from "../../assets/icons/hourglass.png";
import BALANCE_HOURGLASS from "../../assets/icons_stats/balance_hourglass_orange.png";
import BALANCE from "../../assets/icons_stats/balance_orange.png";
import COMMUNITY_CIRCLE from "../../assets/icons_stats/community_green.png";
import KLEROS from "../../assets/icons_stats/kleros.png";
import KLEROS_MIN from "../../assets/icons_stats/kleros_min.png";
import KLEROS_VOTE from "../../assets/icons_stats/kleros_vote.png";
import VOTE_REWARD from "../../assets/icons_stats/reward_vote.png";
import KLEROS_ARROWS from "../../assets/icons_stats/kleros_arrows.png";

import StatCard from "../StatCard";
import {
  format18DecimalNumber,
  formatAmount,
  formatPNK,
  getCurrency,
  getVoteStake,
} from "../../lib/helpers";
import { useTokenInfo } from "../../hooks/useTokenInfo";
import { useRelativeCourtData } from "../../hooks/useRelativeCourtData";
import { subDays } from "date-fns";

interface Props {
  court: Court;
  chainId: string;
}

const semiBold = {
  /* 14px Semi-bold 600 */
  fontFamily: "Open Sans",
  fontStyle: "normal",
  fontWeight: 600,
  fontSize: "14px",
  lineHeight: "19px",
  color: "#333333",
};

const dollarFormat = {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
};

const casesIn30Days = (disputes: Dispute[] | undefined) => {
    if (disputes === undefined) return 0;
    var today = new Date();
    var priorDate = new Date(new Date().setDate(today.getDate() - 30));
    let filtered = disputes.filter( function (obj) { return new Date(Number(obj.startTime) * 1000) >= priorDate });
    return filtered.length;
}

export default function CourtInfo(props: Props) {
    const [relativeDate, ] = useState<Date>(new Date())  // To avoid refetching the query
  const { data: pnkInfo } = useTokenInfo("kleros");
  const { data: tokenInfo } = useTokenInfo(
    props.chainId === "1" ? "ethereum" : "dai"
  );
  const { data: disputeDiff30Days, isLoading: isLoadingDisputeDiff } = useRelativeCourtData({
    chainId: props.chainId,
    courtId: props.court.subcourtID,
    relTimestamp: subDays(relativeDate, 30),
  });

  return (
    <Box
      sx={{
        background: "#FFFFFF",
        border: "1px solid #E5E5E5",
        boxShadow: "0px 2px 3px rgba(0, 0, 0, 0.06)",
        borderRadius: "3px",
        padding: "10px",
      }}
    >
      <Grid container alignItems="center" justifyContent="start">
        <Grid item xs={12} md={6} lg={3}>
          <StatCard
            title="Min Stake"
            subtitle={
              pnkInfo ? (
                `${(
                  pnkInfo.current_price *
                  Number(format18DecimalNumber(props.court.minStake))
                ).toLocaleString(undefined, dollarFormat)}`
              ) : (
                <Skeleton />
              )
            }
            value={formatPNK(props.court.minStake)}
            image={KLEROS_MIN}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          {/* TODO: Drawn jurors */}
          <StatCard
            title="Active Jurors"
            subtitle={"... Drawn"}
            value={props.court.activeJurors as string}
            image={COMMUNITY_CIRCLE}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard
            title="Cases"
            subtitle={isLoadingDisputeDiff ? <div><Skeleton height="10px" width="10px" variant="rectangular" /> in last 30 days</div>: `${disputeDiff30Days} in last 30 Days`}
            value={props.court.disputesNum as string}
            image={BALANCE}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard
            title={`${getCurrency(props.chainId)} paid to jurors`}
            subtitle={
              tokenInfo ? (
                `${(
                  tokenInfo.current_price *
                  Number(format18DecimalNumber(props.court.totalETHFees))
                ).toLocaleString(undefined, dollarFormat)} at current Price`
              ) : (
                <Skeleton />
              )
            }
            value={formatAmount(props.court.totalETHFees, props.chainId)}
            image={BALANCE}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard
            title="Vote Stake"
            subtitle={
              pnkInfo ? (
                `${(
                  pnkInfo.current_price *
                  getVoteStake(props.court.minStake, props.court.alpha)
                ).toLocaleString(undefined, dollarFormat)} at current price`
              ) : (
                <Skeleton />
              )
            }
            value={`${getVoteStake(
              props.court.minStake,
              props.court.alpha
            )} PNK`}
            image={KLEROS_VOTE}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard
            title="PNK Staked"
            subtitle={
              pnkInfo ? (
                `${(
                  pnkInfo.current_price *
                  Number(format18DecimalNumber(props.court.tokenStaked))
                ).toLocaleString(undefined, dollarFormat)} at current price`
              ) : (
                <Skeleton />
              )
            }
            value={formatPNK(props.court.tokenStaked)}
            image={KLEROS}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard
            title="In Progress"
            subtitle={`${props.court.appealPhaseDisputes} in Appeal Phase`}
            value={props.court.disputesOngoing as string}
            image={BALANCE_HOURGLASS}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard
            title="PNK redistributed"
            subtitle={
              pnkInfo ? (
                `${(
                  pnkInfo.current_price *
                  Number(
                    format18DecimalNumber(props.court.totalTokenRedistributed)
                  )
                ).toLocaleString(undefined, dollarFormat)} at current price`
              ) : (
                <Skeleton />
              )
            }
            value={formatPNK(props.court.totalTokenRedistributed)}
            image={KLEROS_ARROWS}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard
            title="Vote Reward"
            subtitle={
              tokenInfo ? (
                `${(
                  tokenInfo.current_price *
                  Number(format18DecimalNumber(props.court.feeForJuror))
                ).toLocaleString(undefined, dollarFormat)} at current price`
              ) : (
                <Skeleton />
              )
            }
            value={formatAmount(
              props.court.feeForJuror,
              props.chainId,
              true,
              true
            )}
            image={VOTE_REWARD}
          />
        </Grid>
      </Grid>
      <Grid container display="flex">
        <Grid item xs={12} sm={6} display="flex" alignItems="center">
          <img src={HOURGLASS} alt="hourglass" height="16px" />
          <Typography sx={semiBold}>Time per Period</Typography>
        </Grid>
        <Grid
          item
          xs={12}
          sm={6}
          display="flex"
          alignItems="center"
          justifyContent="end"
        >
          <img src={COMMUNITY} alt="hourglass" height="16px" />
          <Typography>Jurors for court jump:&nbsp;</Typography>
          <Typography sx={semiBold}>
            {props.court.jurorsForCourtJump}
          </Typography>
        </Grid>
        <Grid item xs={12} overflow="scroll">
          <PeriodStatus
            currentPeriod="execution"
            court={props.court}
            showTimeLeft={false}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

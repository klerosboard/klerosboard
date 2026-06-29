import { Grid, Skeleton, Typography } from "@mui/material";
import { subDays } from "date-fns";
import React, { useEffect, useState } from "react";
import { useKlerosCounter } from "../hooks/useKlerosCounters";
import { useChainId } from "../hooks/useChainId";
import {
  COOP_MULTISIGS,
  formatAmount,
  formatPNK,
  getCurrency,
} from "../lib/helpers";

import Header from "../components/Header";
import StatCard from "../components/StatCard";

// Logos
import ARROW_DOWN from "../assets/icons/arrow_down_violet.png";
import ARROW_UP from "../assets/icons/arrow_up_violet.png";
import DASHBOARD from "../assets/icons/dashboard_violet.png";
import BALANCE from "../assets/icons_stats/balance_orange.png";
import COMMUNITY from "../assets/icons_stats/community_green.png";
import COMMUNITY_NO_CIRCLE from "../assets/icons_stats/community_no_circle.png";
import DICE from "../assets/icons_stats/dice_violet.png";
import ETHEREUM from "../assets/icons_stats/ethereum.png";
import KLEROS from "../assets/icons_stats/kleros.png";
import KLEROS_ARROWS from "../assets/icons_stats/kleros_arrows.png";
import KLEROS_CIRCLE from "../assets/icons_stats/kleros_circle.png";
import KLEROS_ORACLE from "../assets/icons_stats/kleros_oracle.png";
import REWARD from "../assets/icons_stats/reward.png";
import REWARD_UP from "../assets/icons_stats/reward_up.png";
import STATS from "../assets/icons_stats/stats.png";
import CourtLink from "../components/CourtLink";
import LatestDisputes from "../components/LatestDisputes";
import LatestStakes from "../components/LatestStakes";
import { Court, KlerosCounter } from "../graphql/subgraph";
import { useCourts } from "../hooks/useCourts";
import { useMostActiveCourt } from "../hooks/useMostActiveCourt";
import { usePNKBalance } from "../hooks/usePNKBalance";
import { useTokenInfo } from "../hooks/useTokenInfo";
import { DecimalBigNumber } from "../lib/DecimalBigNumber";
import { getLastMonthReward, getStakingReward } from "../lib/rewards";

export const row_css = {
  justifyContent: "space-between",
  alignItems: "center",
  border: "1px solid #E5E5E5",
  boxShadow: "0px 2px 3px rgba(0, 0, 0, 0.06)",
  borderRadius: "3px",
  margin: "10px 0px",
  paddingTop: "0px",
  width: "100%",
};

const blackText = {
  fontStyle: "normal",
  fontWeight: 600,
  fontSize: "14px",
  lineHeight: "19px",
  color: "#333333",
};

const grayText = {
  fontStyle: "normal",
  fontWeight: 400,
  fontSize: "14px",
  lineHeight: "19px",
};

function getMaxReward(courts: Court[]): Court {
  return courts.reduce((a, b) =>
    Number(a.feeForJuror) > Number(b.feeForJuror) ? a : b
  );
}

function getMaxChance(courts: Court[]): Court {
  return courts.reduce((a, b) =>
    Number(a.tokenStaked) > Number(b.feeForJuror) ? b : a
  );
}

function getJurorsGrowth(kc: KlerosCounter, kcOld: KlerosCounter) {
  return Number(kcOld.activeJurors) - Number(kc.activeJurors);
}

export function getPercentageStaked(
  kc: KlerosCounter,
  totalSupply: string | number
): string {
  const tokenStaked = Number(
    new DecimalBigNumber(BigInt(String(kc.tokenStaked)), 18)
  );
  return ((tokenStaked / Number(totalSupply)) * 100).toFixed(2);
}

export default function Home() {
  const chainId = useChainId();

  const [relativeDate] = useState<Date>(new Date()); // To avoid refetching the query
  const [jurorAdoption, setJurorAdoption] = useState<number | undefined>(
    undefined
  );
  const { data: kc } = useKlerosCounter({ chainId: chainId! });
  const { data: kcOld } = useKlerosCounter({
    chainId: chainId!,
    relTimestamp: subDays(relativeDate, 7),
  });
  const { data: mostActiveCourt } = useMostActiveCourt({ chainId: chainId! });
  const { data: mostActiveCourtRelative } = useMostActiveCourt({
    chainId: chainId!,
    relTimestamp: subDays(relativeDate, 7),
  });
  const { data: courts } = useCourts({ chainId: chainId! });
  const { data: pnkInfo } = useTokenInfo("kleros");
  const { data: ethInfo } = useTokenInfo("ethereum");
  const { balance: coop_pnk_balance, totalSupply } =
    usePNKBalance(COOP_MULTISIGS);
  const [circulatingSupply, setCirculatingSupply] = useState<
    number | undefined
  >(undefined); // To avoid refetching the query
  const [stakingReward, setStakingReward] = useState<number | undefined>(
    undefined
  ); // To avoid refetching the query
  const [lastMonthReward, setLastMonthReward] = useState<number>(0);
  useEffect(() => {
    (async () => setLastMonthReward(await getLastMonthReward()))();
  }, []);

  useEffect(() => {
    (async () => {
      if (chainId && kc && totalSupply) {
        setStakingReward(
          await getStakingReward(chainId, kc.tokenStaked, totalSupply)
        );
      }
    })();
  }, [chainId, kc, totalSupply]);

  useEffect(() => {
    if (kc && kcOld) {
      setJurorAdoption(getJurorsGrowth(kc, kcOld));
    }
  }, [kc, kcOld]);

  useEffect(() => {
    if (totalSupply && coop_pnk_balance !== undefined) {
      setCirculatingSupply(totalSupply - coop_pnk_balance);
    }
  }, [totalSupply, coop_pnk_balance]);

  return (
    <div>
      <Header
        logo={DASHBOARD}
        title="Dashboard"
        text="Welcome to Klerosboard! Find metrics and insights about Kleros."
      />
      <Grid container sx={{ justifyContent: "center", alignItems: "start", width: "100%" }}>
         <Grid container columnSpacing={0} sx={row_css}>
           <Grid size={{ xs: 12, md: 4, lg: 3 }}>
             <StatCard
               title={"Most Active Court"}
               subtitle={"All times"}
               value={
                 mostActiveCourt ? (
                   <CourtLink chainId={chainId!} courtId={mostActiveCourt.id} />
                 ) : (
                   <Skeleton />
                 )
               }
               image={BALANCE}
             />
           </Grid>
           <Grid size={{ xs: 12, md: 4, lg: 3 }}>
             <StatCard
               title={"Most Active Court"}
               subtitle={"Last 7 days"}
               value={
                 mostActiveCourtRelative ? (
                   <CourtLink
                     chainId={chainId!}
                     courtId={mostActiveCourtRelative.id}
                   />
                 ) : (
                   <Skeleton />
                 )
               }
               image={BALANCE}
             />
           </Grid>
           <Grid size={{ xs: 12, md: 4, lg: 3 }}>
             <StatCard
               title={"Highest Draw Chance"}
               subtitle={"All times"}
               value={
                 courts ? (
                   <CourtLink
                     chainId={chainId!}
                     courtId={getMaxChance(courts).id}
                   />
                 ) : (
                   <Skeleton />
                 )
               }
               image={DICE}
             />
           </Grid>
           <Grid size={{ xs: 12, md: 4, lg: 3 }}>
             <StatCard
               title={"Highest reward chance"}
               subtitle={"All times"}
               value={
                 courts ? (
                   <CourtLink
                     chainId={chainId!}
                     courtId={getMaxReward(courts).id}
                   />
                 ) : (
                   <Skeleton />
                 )
               }
               image={REWARD_UP}
             />
           </Grid>
         </Grid>
         <Grid container columnSpacing={0} sx={row_css}>
           <Grid size={{ xs: 12, md: 4, lg: "grow" }}>
             <StatCard
               title={"PNK Staked"}
               subtitle={"All times"}
               value={kc ? formatPNK(kc.tokenStaked) : undefined}
               image={KLEROS}
             />
           </Grid>
           <Grid size={{ xs: 12, md: 4, lg: "grow" }}>
             <StatCard
               title={`${getCurrency(chainId!)} Paid`}
               subtitle={"All times"}
               value={kc ? formatAmount(kc.totalETHFees, chainId!) : undefined}
               image={ETHEREUM}
             />
           </Grid>
           <Grid size={{ xs: 12, md: 4, lg: "grow" }}>
             <StatCard
               title={"PNK Redistributed"}
               subtitle={"All times"}
               value={kc ? formatPNK(kc.totalTokenRedistributed) : undefined}
               image={KLEROS_ORACLE}
             />
           </Grid>
           <Grid size={{ xs: 12, md: 4, lg: "grow" }}>
             <StatCard
               title={"Active Jurors"}
               subtitle={"All times"}
               value={kc?.activeJurors}
               image={COMMUNITY}
             />
           </Grid>
           <Grid size={{ xs: 12, md: 4, lg: "grow" }}>
             <StatCard
               title={"Cases"}
               subtitle={"All times"}
               value={kc?.disputesCount}
               image={BALANCE}
             />
           </Grid>
         </Grid>
         <Grid container columnSpacing={1} sx={row_css}>
           <Grid size={{ xs: 12, md: 4, lg: "grow" }}>
             <StatCard
               title={"PNK Total Supply"}
               subtitle={`%${
                 totalSupply && kc ? getPercentageStaked(kc, totalSupply) : "..."
               } Staked`}
               value={
                 totalSupply ? (
                   totalSupply.toLocaleString(undefined, {
                     maximumFractionDigits: 0,
                   })
                 ) : (
                   <Skeleton />
                 )
               }
               image={KLEROS_CIRCLE}
             />
           </Grid>
           <Grid size={{ xs: 12, md: 4, lg: "grow" }}>
             <StatCard
               title={"Circulating Supply"}
               subtitle={`%${
                 circulatingSupply && kc
                   ? getPercentageStaked(kc, circulatingSupply)
                   : "..."
               } Staked`}
               value={
                 circulatingSupply ? (
                   circulatingSupply.toLocaleString(undefined, {
                     maximumFractionDigits: 0,
                   })
                 ) : (
                   <Skeleton />
                 )
               }
               image={KLEROS_ARROWS}
             />
           </Grid>
           <Grid size={{ xs: 12, md: 4, lg: "grow" }}>
             <StatCard
               title={"PNK Volume in 24h"}
               subtitle={`Price change: ${
                 pnkInfo ? (pnkInfo.price_change_24h * 100).toFixed(2) : "..."
               }%`}
                value={pnkInfo ? "$ " + pnkInfo.total_volume.toLocaleString() : undefined}
               image={STATS}
             />
           </Grid>
           <Grid size={{ xs: 12, md: 4, lg: "grow" }}>
             <StatCard
               title={"PNK Price"}
               subtitle={`ETH = $ ${
                 ethInfo ? ethInfo.current_price.toLocaleString() : "..."
               }`}
                value={pnkInfo ? "$" + pnkInfo.current_price.toFixed(3) : undefined}
               image={KLEROS}
             />
           </Grid>
           <Grid size={{ xs: 12, md: 4, lg: "grow" }}>
             <StatCard
               title={"Staking Rewards APY"}
               subtitle={`Last Month: ${lastMonthReward.toFixed(0)} PNKs`}
               value={stakingReward ? `${stakingReward.toFixed(2)}%` : undefined}
               image={REWARD}
             />
           </Grid>
         </Grid>
          <Grid
            container
            columnSpacing={0}
            sx={{ justifyContent: "center", alignItems: "center", display: "flex" }}
          >
           <Grid size={{ xs: 12, md: 3 }} sx={{ display: "flex", alignItems: "center" }}>
             <img
               height={"14px"}
               src={COMMUNITY_NO_CIRCLE}
               alt={"Community logo"}
               style={{ marginRight: "15px" }}
             />
             <Typography sx={blackText}>
               Jurors' growth (last month):{" "}
             </Typography>
           </Grid>
            <Grid size={{ xs: 12, md: 3 }} sx={{ alignItems: "center", display: "inline-flex" }}>
             <img
               height={"14px"}
               src={jurorAdoption && jurorAdoption < 0 ? ARROW_DOWN : ARROW_UP}
               alt={"Arrow"}
               style={{ marginRight: "15px" }}
             />
             <Typography sx={grayText}>Adoption:&nbsp;</Typography>
              <Typography sx={{ ...blackText, display: "flex" }}>
                 {jurorAdoption !== undefined ? (
                   jurorAdoption
                 ) : (
                   <Skeleton variant="circular" width={"10px"} />
                 )}{" "}
                 new jurors
              </Typography>
           </Grid>
            <Grid size={{ xs: 12, md: 3 }} sx={{ alignItems: "center", display: "inline-flex" }}>
             <img
               height={"14px"}
               src={jurorAdoption && jurorAdoption < 0 ? ARROW_DOWN : ARROW_UP}
               alt={"Arrow"}
               style={{ marginRight: "15px" }}
             />
             <Typography sx={grayText}>Retention:&nbsp;</Typography>
              <Typography sx={{ ...blackText, display: "flex" }}>
                 {jurorAdoption !== undefined ? (
                   ((jurorAdoption / Number(kcOld?.activeJurors ?? 1)) * 100).toFixed(
                     2
                   ) + "%"
                 ) : (
                   <Skeleton variant="circular" width={"10px"} />
                 )}
              </Typography>
           </Grid>
         </Grid>
      </Grid>

       <Grid container spacing={2} sx={{ marginTop: "40px" }}>
         <Grid size={{ xs: 12, md: 6 }}>
           <LatestStakes chainId={chainId!} />
         </Grid>

         <Grid size={{ xs: 12, md: 6 }}>
           <LatestDisputes chainId={chainId!} courtId={undefined} />
         </Grid>
       </Grid>
    </div>
  );
}

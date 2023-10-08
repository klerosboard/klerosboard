import { Divider, Grid, Typography } from "@mui/material";
import React, { useEffect, useMemo } from "react";
import ARBITRABLE from "../../assets/icons/arbitrable_violet.png";
import COMMUNITY from "../../assets/icons/community_violet.png";
import BALANCE from "../../assets/icons/balance_violet.png";
import BOOKMARK from "../../assets/icons/bookmark.png";
import ArbitrableLink from "../ArbitrableLink";
import CourtLink from "../CourtLink";
import { BigNumberish } from "ethers";
import {
  GNOSIS_KLEROSLIQUID,
  MAINNET_KLEROSLIQUID,
  formatDate,
  getRPCURL,
  arbitrableWhitelist
} from "../../lib/helpers";
import JurorLink from "../JurorLink";
import { MetaEvidence } from "../../lib/types";

interface Props {
  id: string;
  chainId: string;
  arbitrableId: string;
  creatorId: string;
  courtId: string;
  startTimestamp: BigNumberish;
  roundNum: number;
  metaEvidence?: MetaEvidence;
}

const normalizeIPFSUri = (uri: string) =>
  uri.replace(/^\/ipfs\//, "https://ipfs.kleros.io/ipfs/");

export default function CaseInfo(props: Props) {
  const evidenceDisplayInterfaceURL = useMemo(() => {
    if (props.metaEvidence?.metaEvidenceJSON?.evidenceDisplayInterfaceURI) {
      // hack to allow displaying old t2cr disputes, since old endpoint was lost
      const evidenceDisplayInterfaceURI =
        props.arbitrableId.toLowerCase() === "0xEbcf3bcA271B26ae4B162Ba560e243055Af0E679".toLowerCase()
          ? "/ipfs/QmYs17mAJTaQwYeXNTb6n4idoQXmRcAjREeUdjJShNSeKh/index.html"
          : props.metaEvidence.metaEvidenceJSON.evidenceDisplayInterfaceURI;

      const { _v = "0" } = props.metaEvidence.metaEvidenceJSON;

      const arbitratorChainID =
        props.metaEvidence.metaEvidenceJSON?.arbitratorChainID ?? props.chainId;
      const arbitrableChainID =
        props.metaEvidence.metaEvidenceJSON?.arbitrableChainID ??
        arbitratorChainID;

      let url = normalizeIPFSUri(evidenceDisplayInterfaceURI);
      const paramsObjets = {
        disputeID: props.id,
        chainID: props.chainId, // Deprecated. Use arbitratorChainID and arbitrableChainID instead.
        arbitratorContractAddress:
          props.chainId === "1" ? MAINNET_KLEROSLIQUID : GNOSIS_KLEROSLIQUID,
        arbitratorChainID: arbitratorChainID,
        arbitratorJsonRpcUrl: getRPCURL(arbitratorChainID),
        arbitrableContractAddress: props.arbitrableId,
        arbitrableChainID: arbitrableChainID,
        arbitrableJsonRpcUrl: getRPCURL(arbitrableChainID),
      };
      if (_v === "0") {
        url += `?${encodeURIComponent(JSON.stringify(paramsObjets))}`;
      } else {
        const searchParams = new URLSearchParams(paramsObjets);
        url += `?${searchParams.toString()}`;
      }

      return url;
    }
  }, [props.metaEvidence, props.id, props.chainId, props.arbitrableId]);


  useEffect(() => {
    if (props.arbitrableId && !arbitrableWhitelist[Number(props.chainId)]?.includes(props.arbitrableId.toLowerCase()))
      console.warn("Arbitrable not included in whitelist for evidence display");
  }, [props]);

  return (
    <div
      style={{
        width: "100%",
        margin: "20px 0px",
        background: "#FFFFFF",
        padding: "10px",
        border: "1px solid #E5E5E5",
        /* Card Drop Shadow */
        boxShadow: "0px 2px 3px rgba(0, 0, 0, 0.06)",
        borderRadius: "3px",
      }}
    >
      <div style={{ width: "100%", margin: "20px 0px" }}>
        <Typography>
          {props.metaEvidence
            ? `${props.metaEvidence.metaEvidenceJSON.title}: ${props.metaEvidence.metaEvidenceJSON.question}`
            : "Error trying to read metaEvidence of the Dispute. Please refresh the page"}
        </Typography>
        <a
          href={`https://court.kleros.io/cases/${props.id}`}
          target="_blank"
          rel="noreferrer"
        >
          Check the details on Kleros Court
        </a>

        {props.metaEvidence &&
          props.metaEvidence.metaEvidenceJSON.evidenceDisplayInterfaceURI && (
            <iframe
              title="dispute details"
              sandbox={
                arbitrableWhitelist[Number(props.chainId)]?.includes(props.arbitrableId.toLowerCase())
                  ? "allow-scripts allow-same-origin"
                  : "allow-scripts"
              }
              style={{
                width: "1px",
                minWidth: "100%",
                //height: "360px",
                minHeight: "50px",
                border: "none",
              }}
              src={evidenceDisplayInterfaceURL}
            />
          )}
      </div>

      <Divider sx={{ margin: "10px 0px", width: "90%", marginLeft: "5%" }} />

      <div style={{ width: "100%", display: "flex", margin: "10px 0px" }}>
        <Grid container justifyContent={"start"}>
          <Grid
            container
            item
            xs={12}
            md={6}
            justifyContent="start"
            alignContent="center"
          >
            <Grid item margin={"10px"}>
              <img src={ARBITRABLE} height="24px" alt="arbitrable logo" />
            </Grid>
            <Grid container item xs={9}>
              <Grid item xs={12}>
                <ArbitrableLink
                  id={props.arbitrableId}
                  chainId={props.chainId}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography
                  sx={{
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: "14px",
                    lineHeight: "19px",
                  }}
                >
                  Arbitrable
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Grid
            container
            item
            xs={12}
            md={12}
            justifyContent="start"
            alignContent="center"
          >
            <Grid item margin={"10px"}>
              {/* TODO:  Change to Avatar*/}
              <img src={COMMUNITY} height="24px" alt="community logo" />
            </Grid>
            <Grid container item xs={9}>
              <Grid item xs={12}>
                <JurorLink address={props.creatorId} chainId={props.chainId} />
              </Grid>
              <Grid item xs={12}>
                <Typography
                  sx={{
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: "14px",
                    lineHeight: "19px",
                  }}
                >
                  Creator
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </div>

      <Divider sx={{ margin: "10px 0px", width: "90%", marginLeft: "5%" }} />
      <Grid container spacing={2}>
        <Grid item xs={12} display="inline-flex">
          <img src={BALANCE} height="24px" alt="court logo" />{" "}
          <Typography>Court: </Typography>
          <Typography>
            <CourtLink chainId={props.chainId} courtId={props.courtId} />{" "}
          </Typography>
        </Grid>
        <Grid item display="inline-flex">
          <img src={BOOKMARK} height="24px" alt="date" />{" "}
          <Typography>Start Date: </Typography>
          <Typography>{formatDate(props.startTimestamp as number)}</Typography>
        </Grid>
        <Grid item display="inline-flex">
          <img src={BALANCE} height="24px" alt="round" />{" "}
          <Typography>Round: </Typography>
          <Typography>{props.roundNum}</Typography>
        </Grid>
      </Grid>
    </div>
  );
}

import { Grid, Paper, Typography } from "@mui/material";
import React from "react";
import { Evidence } from "../lib/types";
import { shortenIfAddress } from "@usedapp/core";
import { formatDate } from "../lib/helpers";
import { AttachFile } from "@mui/icons-material";

const titleCSS = {
  fontSize: "20px",
  fontWeight: 600,
  lineHeight: "33px",
  fontStyle: "normal",
  color: "#333333",
  overflow: "visible",
};

const valueCSS = {
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "19px",
  fontStyle: "normal",
  color: "text.secondary",
};

const subTitleCSS = {
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "19px",
  fontStyle: "normal",
  color: "text.secondary",
};

export default function EvidenceCard({ evidence }: { evidence: Evidence }) {
  return (
    <Paper
      sx={{
        minWidth: 190,
        minHeight: 50,
        border: "none",
        boxShadow: "none",
        overflow: "clip",
      }}
    >
      <Grid container spacing={0} justifyContent={"center"} display={"flex"}>
        <Grid item xs={12} padding="0px">
          <Typography sx={titleCSS} gutterBottom noWrap>
            {evidence.evidenceJSON.name? evidence.evidenceJSON.name: evidence.evidenceJSON.title}
          </Typography>
        </Grid>

        <Grid
          item
          xs={12}
          justifyItems={"space-between"}
          justifyContent={"space-between"}
          container
        >
          <Grid item xs={9} padding="0px">
            <Typography component="div" sx={valueCSS}>
              {evidence.evidenceJSON.description}
            </Typography>
          </Grid>
          <Grid item xs={3} padding="0px" justifyContent={"end"} sx={{ textAlign: "right" }}>
            {evidence.evidenceJSON.fileURI ? (
              <a
                href={`https://ipfs.kleros.io/${evidence.evidenceJSON.fileURI}`}
                target="_blank"
                rel="noreferrer"
              >
                <AttachFile height={"10px"} />
              </a>
            ) : null}
          </Grid>
        </Grid>
        <Grid
          item
          xs={12}
          padding="0px"
          justifyContent={"end"}
          sx={{ textAlign: "right" }}
        >
          <Typography sx={subTitleCSS} gutterBottom noWrap>
            Submitted by: {shortenIfAddress(evidence.submittedBy)} in{" "}
            {formatDate(Number(evidence.submittedAt))}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
}

import React, { useState } from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import { DataGrid, GridRenderCellParams, GridValueFormatterParams } from "@mui/x-data-grid";
import { BigNumberish } from "ethers";
import CourtLink from "../CourtLink";
import { Link } from "@mui/material";
import { Link as LinkRouter } from "react-router-dom";
import { Dispute, Round, Vote } from "../../graphql/subgraph";
import { CustomFooter } from "../DataGridFooter";
import VoteMapping from "./VoteMapping";

interface Props {
  votes: Vote[] | undefined;
  chainId: string;
  isLoading: boolean;
}

export default function VotedCases(props: Props) {
  const [pageSize, setPageSize] = useState<number>(10);
  const columns = [
    {
      field: "dispute",
      headerName: "#",
      flex: 1,
      valueFormatter: (params: GridValueFormatterParams) => `${params.value.id}`,
      renderCell: (params: GridRenderCellParams<Dispute>) => (
        <Link
          component={LinkRouter}
          to={`/${props.chainId}/cases/${params.value!.id}`}
          children={params.value!.id}
        />
      ),
    },
    {
      field: "subcourtID",
      headerName: "Court",
      flex: 1,
      valueFormatter: (params: GridValueFormatterParams) => {
        const row: Vote = params.api.getRow(params.id);
        if (row){
            return `${row.dispute.subcourtID.id}`
        }
        return undefined
      },
      renderCell: (params: GridRenderCellParams<BigNumberish>) => (
        <CourtLink
          chainId={props.chainId}
          courtId={params.row.dispute.subcourtID.id as string}
        />
      ),
    },
    {
      field: "round",
      headerName: "Round",
      flex: 2,
      valueFormatter: (params: GridValueFormatterParams) => `${params.id?.toString().split("-").at(-1)}`,
      renderCell: (params: GridRenderCellParams<Round>) =>
        params.value!.id.split("-").at(-1),
    },
    {
      field: "period",
      headerName: "Period",
      flex: 1,
      valueFormatter: (params: GridValueFormatterParams) => {
        const row: Vote = params.api.getRow(params.id);
        if (row){
            return row.dispute.period.charAt(0).toUpperCase() +
            row.dispute.period.slice(1)
        }
        return undefined
      }
    },
    {
      field: "choice",
      headerName: "Vote",
      flex: 1,
      valueFormatter: (params: GridValueFormatterParams) => `${params.value}`,
      renderCell: (params: GridRenderCellParams<BigNumberish>) => {
        if (params.row) {
          return (
            <VoteMapping
              chainId={props.chainId}
              vote={params.row}
              option="choice"
            />
          );
        }
      },
    },
    {
      field: "currentRulling",
      headerName: "Current Rulling",
      flex: 1,
      valueFormatter: (params: GridValueFormatterParams) => {
        const row: Vote = params.api.getRow(params.id);
        if (row){
            return row.dispute.currentRulling
        }
        return undefined
      },
      renderCell: (params: GridRenderCellParams<BigNumberish>) => {
        if (params.row) {
          return (
            <VoteMapping
              chainId={props.chainId}
              vote={params.row}
              option="currentRulling"
            />
          );
        }
      },
    },
  ];

  return (
    <Box>
      <Typography
        sx={{
          fontSize: "24px",
          fontWeight: 600,
          fontStyle: "normal",
          marginTop: "40px",
        }}
      >
        Votes:&nbsp;{" "}
        {props.votes ? props.votes.length : <Skeleton width={"20px"} />}{" "}
      </Typography>
      {
        <DataGrid
          sx={{ marginTop: "30px" }}
          rows={props.votes ? props.votes! : []}
          columns={columns}
          loading={props.isLoading}
          pageSize={pageSize}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          rowsPerPageOptions={[10, 50, 100]}
          pagination
          disableSelectionOnClick
          autoHeight={true}
          components={{
            Footer: CustomFooter,
          }}
        />
      }
    </Box>
  );
}

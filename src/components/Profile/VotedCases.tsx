import { Box, Link, Skeleton, Typography } from "@mui/material";
import {
  DataGrid,
  GridRenderCellParams,
  GridValueFormatterParams,
} from "@mui/x-data-grid";
import { BigNumberish } from "../../lib/types";
import React, { useState } from "react";
import { Link as LinkRouter } from "react-router-dom";
import { Dispute, Round, Vote } from "../../graphql/subgraph";
import CourtLink from "../CourtLink";
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
       valueFormatter: (value) =>
         `${value.id}`,
       sortComparator: (a: Dispute, b: Dispute) => Number(a.id) - Number(b.id),
       renderCell: (params: GridRenderCellParams<Dispute>) => (
         <Link
           component={LinkRouter}
           to={`/${props.chainId}/cases/${value!.id}`}
           children={value!.id}
         />
       ),
     },
    {
      field: "subcourtID",
      headerName: "Court",
      flex: 1,
      valueFormatter: (value: any) => { const row: Vote = params.api.getRow(params.id);
        if (row) {
          return `${row.dispute.subcourtID.id}`;
        }
        return undefined;
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
       valueFormatter: (value) =>
         `${value?.toString().split("-").at(-1)}`,
       renderCell: (params: GridRenderCellParams<Round>) =>
         value!.id.split("-").at(-1),
     },
    {
      field: "period",
      headerName: "Period",
      flex: 1,
      valueFormatter: (value: any) => { const row: Vote = params.api.getRow(params.id);
        if (row) {
          return (
            row.dispute.period.charAt(0).toUpperCase() +
            row.dispute.period.slice(1)
          );
        }
        return undefined;
      },
    },
    {
      field: "choice",
      headerName: "Vote",
      flex: 1,
      valueFormatter: (value: any) => `${value}`,
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
      valueFormatter: (value: any) => { const row: Vote = params.api.getRow(params.id);
        if (row) {
          return row.dispute.currentRulling;
        }
        return undefined;
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
           paginationModel={{ page: 0, pageSize }}
           loading={props.isLoading}
           onPaginationModelChange={(model) => setPageSize(model.pageSize)}
           pageSizeOptions={[10, 50, 100]}
           disableSelectionOnClick
           autoHeight={true}
           initialState={{
             sorting: {
               sortModel: [{ field: "dispute", sort: "desc" }],
             },
           }}
           slots={{
             footer: CustomFooter,
           }}
         />
       }
    </Box>
  );
}

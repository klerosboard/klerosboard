import { Box, Skeleton, Typography } from "@mui/material";
import { DataGrid, GridRenderCellParams, GridValueFormatterParams } from "@mui/x-data-grid";
import { BigNumberish } from "ethers";
import React from "react";
import { formatDate, getBlockExplorer } from "../../lib/helpers";
import CourtLink from "../CourtLink";
import { Link } from "@mui/material";
import { Link as LinkRouter } from "react-router-dom";
import { Court, Dispute } from "../../graphql/subgraph";
import { CustomFooter } from "../DataGridFooter";

interface Props {
  cases: Dispute[] | undefined;
  chainId: string;
  isLoading: boolean;
}

export default function CreatedCases(props: Props) {
  const blockExplorer = getBlockExplorer(props.chainId);

  const dispute_columns = [
    {
      field: "id",
      headerName: "#",
      flex: 1,
      renderCell: (params: GridRenderCellParams<Court>) => (
        <Link
          component={LinkRouter}
          to={`/${props.chainId}/cases/${params.value}`}
          children={params.value}
        />
      ),
    },
    {
      field: "subcourtID",
      headerName: "Court",
      flex: 2,
      valueFormatter: (params: GridValueFormatterParams) => {
        const row: Dispute = params.api.getRow(params.id);
        if (row){
            return row.subcourtID.id
        }
        return undefined
      },
      renderCell: (params: GridRenderCellParams<Court>) => (
        <CourtLink
          chainId={props.chainId}
          courtId={params.value!.id as string}
        />
      ),
    },
    {
      field: "startTime",
      headerName: "Date",
      flex: 2,
      renderCell: (params: GridRenderCellParams<BigNumberish>) =>
        formatDate(Number(params.value!)),
    },
    {
      field: "txid",
      headerName: "txID",
      flex: 1,
      renderCell: (params: GridRenderCellParams<string>) => (
        <a
          href={`${blockExplorer}/tx/${params.value}`}
          rel="noreferrer"
          target="_blank"
        >{`${params.value?.slice(0, 6)}...${params.value?.slice(-4)}`}</a>
      ),
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
        Cases Created:&nbsp;{" "}
        {props.cases ? props.cases.length : <Skeleton width={"20px"} />}{" "}
      </Typography>
      {
        <DataGrid
          sx={{ marginTop: "30px" }}
          rows={props.cases ? props.cases! : []}
          columns={dispute_columns}
          loading={props.isLoading}
          pageSize={10}
          disableSelectionOnClick
          autoHeight={true}
          hideFooter={false}
          components={{
            Footer: CustomFooter,
          }}
        />
      }
    </Box>
  );
}

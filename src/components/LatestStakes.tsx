import React from "react";
import { Box, Typography } from "@mui/material";
import { DataGrid, GridRenderCellParams, GridValueFormatterParams } from "@mui/x-data-grid";
import { shortenAddress } from "@usedapp/core";
import { BigNumberish } from "ethers";
import { Juror } from "../graphql/subgraph";
import { useStakes } from "../hooks/useStakes";
import CourtLink from "./CourtLink";
import { Link as LinkRouter } from "react-router-dom";
import { Link } from "@mui/material";
import { formatDate, formatPNK } from "../lib/helpers";
import { CustomFooter } from "./DataGridFooter";

interface Props {
  chainId: string;
  courtId?: string;
  jurorId?: string;
  hideFooter?: boolean;
}

export default function LatestStakes(props: Props) {
  const { data: stakes, isLoading: stakes_loading } = useStakes({
    chainId: props.chainId,
    subcourtID: props.courtId,
    jurorID: props.jurorId,
  });
  const columns_stakes = [
    {
      field: "address",
      headerName: "Juror",
      flex: 1,
      valueFormatter: (params: GridValueFormatterParams) => `${params.value.id}`,
      renderCell: (params: GridRenderCellParams<Juror>) => (
        <Link
          component={LinkRouter}
          to={`/${props.chainId}/profile/${params.value!.id}`}
          children={shortenAddress(params.value!.id)}
        />
      )
    },
    {
      field: "subcourtID",
      headerName: "Court Name",
      flex: 2,
      renderCell: (params: GridRenderCellParams<BigNumberish>) => (
        <CourtLink chainId={props.chainId} courtId={params.value! as string} />
      ),
    },
    {
      field: "stake",
      headerName: "Last Stake",
      type: "number",
      flex: 1,
      valueFormatter: (params: GridValueFormatterParams) => {
        // console.log(params.value)
        return formatPNK(params.value);
      },
    },
  ];
  const columns_stakes_wihtout_court = [
    {
      field: "address",
      headerName: "Juror",
      flex: 1,
      valueFormatter: (params: GridValueFormatterParams) => `${params.value.id}`,
      renderCell: (params: GridRenderCellParams<Juror>) => (
        <Link
          component={LinkRouter}
          to={`/${props.chainId}/profile/${params.value!.id}`}
          children={shortenAddress(params.value!.id)}
        />
      )      
    },
    {
      field: "stake",
      headerName: "Stake",
      type: "number",
      flex: 1,
      valueFormatter: (params: GridValueFormatterParams) => {
        return formatPNK(params.value);
      },
    },
    {
      field: "timestamp",
      headerName: "Date",
      type: "number",
      flex: 1,
      valueFormatter: (params: GridValueFormatterParams) => {
        return formatDate(Number(params.value));
      },
    },
  ];

  const columns_stakes_for_juror = [
    {
      field: "subcourtID",
      headerName: "Court Name",
      flex: 2,
      renderCell: (params: GridRenderCellParams<BigNumberish>) => (
        <CourtLink chainId={props.chainId} courtId={params.value! as string} />
      ),
      valueFormatter: (params: GridValueFormatterParams) => {
        return `${params.value}`
      }
    },
    {
      field: "stake",
      headerName: "Stake",
      type: "number",
      flex: 1,
      valueFormatter: (params: GridValueFormatterParams) => {
        return formatPNK(params.value);
      },
    },
    {
      field: "newTotalStake",
      headerName: "Total in Courts",
      type: "number",
      flex: 1,
      valueFormatter: (params: GridValueFormatterParams) => {
        return formatPNK(params.value);
      },
    },
    {
      field: "timestamp",
      headerName: "Date",
      type: "number",
      flex: 1,
      valueFormatter: (params: GridValueFormatterParams) => {
        return formatDate(Number(params.value));
      },
    },
  ];

  return (
    <Box>
      <Typography
        sx={{ fontSize: "24px", fontWeight: 600, fontStyle: "normal" }}
      >
        Latest Stakes
      </Typography>
      {
        <DataGrid
          sx={{ marginTop: "30px" }}
          rows={stakes ? stakes! : []}
          columns={
            props.courtId
              ? columns_stakes_wihtout_court
              : props.jurorId
              ? columns_stakes_for_juror
              : columns_stakes
          }
          loading={stakes_loading}
          pageSize={10}
          disableSelectionOnClick
          autoHeight={true}
          hideFooter={props.hideFooter === undefined ? true : props.hideFooter}
          components={{
            Footer: CustomFooter,
          }}
        />
      }
    </Box>
  );
}

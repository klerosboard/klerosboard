import React from "react";
import { Box, Typography } from "@mui/material";
import { DataGrid, GridRenderCellParams } from "@mui/x-data-grid";
import { shortenAddress } from "../lib/utils";
import { BigNumberish } from "../../lib/types";
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
      valueFormatter: (value: any) => `${(value as any).id}`,
      renderCell: (params: GridRenderCellParams<Juror>) => (
        <Link
          component={LinkRouter}
          to={`/${props.chainId}/profile/${value!.id}`}
          children={shortenAddress(value!.id)}
        />
      )
    },
    {
      field: "subcourtID",
      headerName: "Court Name",
      flex: 2,
      renderCell: (params: GridRenderCellParams<BigNumberish>) => (
        <CourtLink chainId={props.chainId} courtId={value! as string} />
      ),
    },
    {
      field: "stake",
      headerName: "Last Stake",
      type: "number",
      flex: 1,
      valueFormatter: (value: any) => { // console.log(value)
        return formatPNK(value);
      },
    },
  ];
  const columns_stakes_wihtout_court = [
    {
      field: "address",
      headerName: "Juror",
      flex: 1,
      valueFormatter: (value: any) => `${(value as any).id}`,
      renderCell: (params: GridRenderCellParams<Juror>) => (
        <Link
          component={LinkRouter}
          to={`/${props.chainId}/profile/${value!.id}`}
          children={shortenAddress(value!.id)}
        />
      )      
    },
    {
      field: "stake",
      headerName: "Stake",
      type: "number",
      flex: 1,
      valueFormatter: (value: any) => { return formatPNK(value);
      },
    },
    {
      field: "timestamp",
      headerName: "Date",
      type: "number",
      flex: 1,
      valueFormatter: (value: any) => { return formatDate(Number(value));
      },
    },
  ];

  const columns_stakes_for_juror = [
    {
      field: "subcourtID",
      headerName: "Court Name",
      flex: 2,
      renderCell: (params: GridRenderCellParams<BigNumberish>) => (
        <CourtLink chainId={props.chainId} courtId={value! as string} />
      ),
      valueFormatter: (value: any) => { return `${value}`
      }
    },
    {
      field: "stake",
      headerName: "Stake",
      type: "number",
      flex: 1,
      valueFormatter: (value: any) => { return formatPNK(value);
      },
    },
    {
      field: "newTotalStake",
      headerName: "Total in Courts",
      type: "number",
      flex: 1,
      valueFormatter: (value: any) => { return formatPNK(value);
      },
    },
    {
      field: "timestamp",
      headerName: "Date",
      type: "number",
      flex: 1,
      valueFormatter: (value: any) => { return formatDate(Number(value));
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
          paginationModel={{ page: 0, pageSize: 10 }}
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

import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { shortenAddress } from "../lib/utils";
import { StakeSet } from "../graphql/subgraph";
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
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const { data: stakes, isLoading: stakes_loading } = useStakes({
    chainId: props.chainId,
    subcourtID: props.courtId,
    jurorID: props.jurorId,
  });
  const columns_stakes: GridColDef<StakeSet>[] = [
     {
       field: "address",
       headerName: "Juror",
       flex: 1,
       valueFormatter: (value: any) => `${(value as any).id}`,
       renderCell: (params: GridRenderCellParams<StakeSet, { id: string }>) => (
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
       renderCell: (params: GridRenderCellParams<StakeSet>) => (
         <CourtLink chainId={props.chainId} courtId={params.value as string} />
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
  const columns_stakes_wihtout_court: GridColDef<StakeSet>[] = [
     {
       field: "address",
       headerName: "Juror",
       flex: 1,
       valueFormatter: (value: any) => `${(value as any).id}`,
       renderCell: (params: GridRenderCellParams<StakeSet, { id: string }>) => (
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

  const columns_stakes_for_juror: GridColDef<StakeSet>[] = [
     {
       field: "subcourtID",
       headerName: "Court Name",
       flex: 2,
       renderCell: (params: GridRenderCellParams<StakeSet>) => (
         <CourtLink chainId={props.chainId} courtId={params.value as string} />
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
        <DataGrid<StakeSet>
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
          paginationModel={paginationModel}
          onPaginationModelChange={(model) => setPaginationModel(model)}
          disableRowSelectionOnClick
          autoHeight={true}
          hideFooter={props.hideFooter === undefined ? true : props.hideFooter}
          slots={{
            footer: CustomFooter,
          }}
        />
      }
    </Box>
  );
}

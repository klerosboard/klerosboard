import { Box, Skeleton, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { BigNumberish } from "../../lib/types";
import React, { useState } from "react";
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
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const blockExplorer = getBlockExplorer(props.chainId);

  const dispute_columns: GridColDef<Dispute>[] = [
    {
      field: "id",
      headerName: "#",
      flex: 1,
      renderCell: (params: GridRenderCellParams<Dispute>) => (
        <Link
          component={LinkRouter}
          to={`/${props.chainId}/cases/${params.row.id}`}
          children={params.row.id}
        />
      ),
    },
    {
      field: "subcourtID",
      headerName: "Court",
      flex: 2,
      renderCell: (params: GridRenderCellParams<Dispute, Court>) => (
        <CourtLink
          chainId={props.chainId}
          courtId={params.value?.id as string}
        />
      ),
    },
    {
      field: "startTime",
      headerName: "Date",
      flex: 2,
      renderCell: (params: GridRenderCellParams<Dispute, BigNumberish>) =>
        formatDate(Number(params.value)),
    },
    {
      field: "txid",
      headerName: "txID",
      flex: 1,
      renderCell: (params: GridRenderCellParams<Dispute, string>) => (
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
        <DataGrid<Dispute>
          sx={{ marginTop: "30px" }}
          rows={props.cases ? props.cases! : []}
          columns={dispute_columns}
          loading={props.isLoading}
          paginationModel={paginationModel}
          onPaginationModelChange={(model) => setPaginationModel(model)}
          disableRowSelectionOnClick
          autoHeight={true}
          hideFooter={false}
          slots={{
            footer: CustomFooter,
          }}
        />
      }
    </Box>
  );
}

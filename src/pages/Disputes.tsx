import React, { useState } from "react";
import { useDisputes } from "../hooks/useDisputes";
import { formatDate } from "../lib/helpers";
import { DataGrid, GridRenderCellParams, GridValueFormatterParams } from "@mui/x-data-grid";
import { CustomFooter } from "../components/DataGridFooter";
import { Link as LinkRouter, useLocation } from "react-router-dom";
import { Link } from "@mui/material";
import { BigNumberish } from "ethers";
import Header from "../components/Header";
import { Court, Dispute } from "../graphql/subgraph";
import CourtLink from "../components/CourtLink";
import GAVEL from "../assets/icons/gavel_violet.png";

export default function Disputes() {
  const location = useLocation();
  const match = location.pathname.match("(100|1)(?:/|$)");
  const chainId = match ? match[1] : null;
  const { data: disputes, isLoading } = useDisputes({ chainId: chainId! });
  const [pageSize, setPageSize] = useState<number>(10);

  const columns = [
    {
      field: "id",
      headerName: "#",
      flex: 1,
      type: "number",
      renderCell: (params: GridRenderCellParams<string>) => (
        <Link
          component={LinkRouter}
          to={`/${chainId}/cases/${params.value!}`}
          children={`#${params.value!}`}
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
        <CourtLink chainId={chainId!} courtId={params.value!.id as string} />
      ),
    },
    {
      field: "currentRulling",
      headerName: "Current Ruling",
      flex: 1,
    },
    {
      field: "period",
      headerName: "Period",
      flex: 1,
      valueFormatter: (params: { value: string }) => {
        return params.value.charAt(0).toUpperCase() + params.value.slice(1);
      },
    },
    {
      field: "lastPeriodChange",
      headerName: "Last Period Change",
      flex: 1,
      valueFormatter: (params: { value: BigNumberish }) => {
        return formatDate(params.value as number);
      },
    },
  ];

  return (
    <div>
      <Header
        logo={GAVEL}
        title="Disputes"
        text="Find all the cases created, its progress and stats."
      />

      {
        <DataGrid
          rows={disputes ? disputes! : []}
          columns={columns}
          loading={isLoading}
          pageSize={pageSize}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          rowsPerPageOptions={[10, 50, 100]}
          pagination
          disableSelectionOnClick
          initialState={{
            sorting: { sortModel: [{ field: "id", sort: "desc" }] },
          }}
          autoHeight={true}
          components={{
            Footer: CustomFooter,
          }}
        />
      }
    </div>
  );
}

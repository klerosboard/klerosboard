import React, { useState } from "react";
import { useDisputes } from "../hooks/useDisputes";
import { formatDate } from "../lib/helpers";
import { DataGrid, GridRenderCellParams } from "@mui/x-data-grid";
import { CustomFooter } from "../components/DataGridFooter";
import { Link as LinkRouter, useLocation } from "react-router-dom";
import { Link } from "@mui/material";
import { BigNumberish } from "../lib/types";
import Header from "../components/Header";
import { Court, Dispute } from "../graphql/subgraph";
import CourtLink from "../components/CourtLink";
import GAVEL from "../assets/icons/gavel_violet.png";

export default function Disputes() {
  const location = useLocation();
  const match = location.pathname.match("(11155111|100|1)(?:/|$)");
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
       valueFormatter: (value: any) => { const row: Dispute = params.api.getRow(params.id);
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
       valueFormatter: (value) => {
         return value.charAt(0).toUpperCase() + value.slice(1);
       },
     },
     {
       field: "lastPeriodChange",
       headerName: "Last Period Change",
       flex: 1,
       valueFormatter: (value) => {
         return formatDate(value as number);
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
           paginationModel={{ page: 0, pageSize }}
           loading={isLoading}
           onPaginationModelChange={(model) => setPageSize(model.pageSize)}
           pageSizeOptions={[10, 50, 100]}
           disableSelectionOnClick
           initialState={{
             sorting: { sortModel: [{ field: "id", sort: "desc" }] },
           }}
           autoHeight={true}
           slots={{
             footer: CustomFooter,
           }}
         />
       }
    </div>
  );
}

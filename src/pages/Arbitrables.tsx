import React, { useState } from "react";
import { formatAmount, getCurrency } from "../lib/helpers";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { CustomFooter } from "../components/DataGridFooter";
import { Link, Skeleton, Typography } from "@mui/material";
import { Link as LinkRouter, useLocation } from "react-router-dom";
import Header from "../components/Header";
import { useArbitrables } from "../hooks/useArbitrables";
import ARBITRABLE from "../assets/icons/arbitrable_violet.png";
import { useArbitrablesNames } from "../hooks/useArbitrablesNames";
import { Arbitrable, LItem } from "../graphql/subgraph";
import { shortenIfAddress } from "../lib/utils";


function getArbitrableName(arbitrable: string, arbitrableNames: LItem[]): string {
  const foundItem = arbitrableNames.find((item) => item.key1?.toLowerCase() === arbitrable.toLowerCase());
  return foundItem ? foundItem.key0 : shortenIfAddress(arbitrable);
}


export default function Arbitrables() {
  const location = useLocation();
  const match = location.pathname.match('(11155111|100|1)(?:/|$)')
  const chainId = match ? match[1] : null
  const { data: arbitrables, isLoading } = useArbitrables(chainId!);
  const { data: arbitrablesNames } = useArbitrablesNames();
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const columns: GridColDef<Arbitrable>[] = [
     {
       field: "id",
       headerName: "Address",
       flex: 2,
       renderCell: (params: GridRenderCellParams<Arbitrable, string>) => (
         <Link
           component={LinkRouter}
           to={`/${chainId}/arbitrables/${params.value}`}
           children={params.value}
         />
       ),
     },
      {
        field: "name",
        headerName: "Name",
        flex: 2,
        valueGetter: (_value: unknown, row: Arbitrable) => {
          if (!arbitrablesNames) return '';
          return getArbitrableName(row.id, arbitrablesNames);
        },
        renderCell: (params: GridRenderCellParams<Arbitrable>) => {
          if (!arbitrablesNames) return <Skeleton width={120} />;
          const name = getArbitrableName(params.row.id as string, arbitrablesNames);
          return <Typography variant="body2">{name}</Typography>;
        },
      },
    {
      field: "disputesCount",
      headerName: "Created Cases",
      flex: 1,
      type: "number",
    },
     {
       field: "ethFees",
       headerName: `Fees Generated [${getCurrency(chainId!)}]`,
       flex: 1,
       type: "number",
       valueFormatter: (value: any) => {
         return formatAmount(value, chainId!);
       },
     },
  ];

  return (
    <div>
      <Header
        logo={ARBITRABLE}
        title="Arbitrables Data"
        text="Check where the cases come from, and wich arbitrable contract have more leads."
      />

      {
         <DataGrid<Arbitrable>
           rows={arbitrables ? arbitrables! : []}
           columns={columns}
            paginationModel={paginationModel}
            loading={isLoading}
            onPaginationModelChange={(model) => setPaginationModel(model)}
           pageSizeOptions={[10, 50, 100]}
            disableRowSelectionOnClick
           autoHeight={true}
           slots={{
             footer: CustomFooter,
           }}
           initialState={{
             sorting: {
               sortModel: [{ field: "ethFees", sort: "desc" }],
             },
           }}
         />
       }
    </div>
  );
}

import React, { useState } from "react";
import { formatAmount, getCurrency } from "../lib/helpers";
import { DataGrid, GridRenderCellParams } from "@mui/x-data-grid";
import { CustomFooter } from "../components/DataGridFooter";
import { Link } from "@mui/material";
import { Link as LinkRouter, useLocation } from "react-router-dom";
import { BigNumberish } from "../lib/types";
import Header from "../components/Header";
import { useArbitrables } from "../hooks/useArbitrables";
import ARBITRABLE from "../assets/icons/arbitrable_violet.png";
import { useArbitrablesNames } from "../hooks/useArbitrablesNames";
import { LItem } from "../graphql/subgraph";
import { shortenIfAddress } from "../lib/utils";


function getArbitrableName(arbitrable: string, arbitrableNames: LItem[] | undefined): string {
  if (arbitrableNames) {
    const foundItem = arbitrableNames.find((item) => item.keywords.split(' | ')[2].toLowerCase() === arbitrable.toLowerCase());
    return foundItem ? foundItem.keywords.split(' | ')[1] : shortenIfAddress(arbitrable);
  }
  return 'Loading...'
}


export default function Arbitrables() {
  const location = useLocation();
  const match = location.pathname.match('(11155111|100|1)(?:/|$)')
  const chainId = match ? match[1] : null
  const { data: arbitrables, isLoading } = useArbitrables(chainId!);
  const { data: arbitrablesNames } = useArbitrablesNames();
  const [pageSize, setPageSize] = useState<number>(10);
  const columns = [
     {
       field: "id",
       headerName: "Address",
       flex: 2,
       renderCell: (params: GridRenderCellParams<{ value: string }>) => (
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
       valueGetter: (_value: unknown, row: { id: string }) => {
         return getArbitrableName(row.id, arbitrablesNames);
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
       valueFormatter: (value) => {
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
         <DataGrid
           rows={arbitrables ? arbitrables! : []}
           columns={columns}
           paginationModel={{ page: 0, pageSize }}
           loading={isLoading}
           onPaginationModelChange={(model) => setPageSize(model.pageSize)}
           pageSizeOptions={[10, 50, 100]}
           disableSelectionOnClick
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

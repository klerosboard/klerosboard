import React, { useState } from "react";
import Header from "../components/Header";
import { useCourts } from "../hooks/useCourts";
import { DataGrid, GridRenderCellParams } from "@mui/x-data-grid";

import { useLocation } from "react-router-dom";
import { formatAmount, formatPNK } from "../lib/helpers";
import { BigNumberish, ethers } from "ethers";
import CourtLink from "../components/CourtLink";
import BALANCE from "../assets/icons/balance_violet.png";
import { CustomFooter } from "../components/DataGridFooter";

export default function Courts() {
  const location = useLocation();
  const match = location.pathname.match("(100|1)(?:/|$)");
  const chainId = match ? match[1] : null;
  const { data, isLoading } = useCourts({ chainId: chainId! });

  const [pageSize, setPageSize] = useState<number>(10);

  const columns = [
    { field: "id", headerName: "Court Id", flex: 1, type: "number" },
    {
      field: "subcourtID",
      headerName: "Court Name",
      flex: 2,
      renderCell: (params: GridRenderCellParams<BigNumberish>) => (
        <CourtLink chainId={chainId!} courtId={params.value! as string} />
      ),
    },
    {
      field: "tokenStaked",
      headerName: "Total Staked",
      type: "number",
      flex: 1,
      valueFormatter: (params: { value: BigNumberish }) => {
        return formatPNK(params.value, true, true);
      },
    },
    {
      field: "activeJurors",
      headerName: "Active Jurors",
      type: "number",
      flex: 1,
      valueFormatter: (params: { value: BigNumberish }) => {
        return Number(params.value);
      },
    },
    {
      field: "feeForJuror",
      headerName: "Fee for Jurors",
      type: "number",
      flex: 1,
      valueFormatter: (params: { value: BigNumberish }) => {
        return formatAmount(params.value, chainId!);
      },
    },
    {
      field: "minStake",
      headerName: "Min Stake",
      type: "number",
      flex: 1,
      valueFormatter: (params: { value: BigNumberish }) => {
        return formatPNK(params.value);
      },
    },
    {
      field: "voteStake",
      headerName: "Vote Stake",
      flex: 1,
      renderCell: (params: {
        row: { minStake: BigNumberish; alpha: BigNumberish };
      }) => {
        return (
          (
            (Number(ethers.utils.formatUnits(params.row.minStake, "ether")) *
              Number(params.row.alpha)) /
            10000
          ).toLocaleString() + " PNK"
        );
      },
    },
    {
      field: "disputesNum",
      headerName: "Total Disputes",
      type: "number",
      flex: 1,
      valueFormatter: (params: { value: BigNumberish }) => {
        return Number(params.value);
      },
    },
    {
      field: "disputesOngoing",
      headerName: "Open Disputes",
      type: "number",
      flex: 1,
      valueFormatter: (params: { value: BigNumberish }) => {
        return Number(params.value);
      },
    },
  ];

  return (
    <div>
      <Header
        logo={BALANCE}
        title="Courts"
        text="Learn more about the courts, stakes, jurors and other stats"
      />

      {
        <DataGrid
          rows={data ? data! : []}
          columns={columns}
          loading={isLoading}
          pageSize={pageSize}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          rowsPerPageOptions={[10, 50, 100]}
          pagination
          initialState={{
            sorting: { sortModel: [{ field: "id", sort: "asc" }] },
          }}
          disableSelectionOnClick
          autoHeight={true}
          components={{
            Footer: CustomFooter,
          }}
        />
      }
    </div>
  );
}

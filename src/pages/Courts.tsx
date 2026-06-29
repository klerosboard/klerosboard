import React, { useState } from 'react';
import Header from '../components/Header';
import { useCourts } from '../hooks/useCourts';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

import { useChainId } from '../hooks/useChainId';
import { formatAmount, formatPNK } from '../lib/helpers';
import { formatUnits } from 'viem';
import CourtLink from '../components/CourtLink';
import BALANCE from '../assets/icons/balance_violet.png';
import { CustomFooter } from '../components/DataGridFooter';
import { Court } from '../graphql/subgraph';

export default function Courts() {
  const chainId = useChainId();
  const { data, isLoading } = useCourts({ chainId: chainId! });

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  const columns: GridColDef<Court>[] = [
    { field: 'id', headerName: 'Court Id', flex: 1, type: 'number' },
    {
      field: 'subcourtID',
      headerName: 'Court Name',
      flex: 2,
      renderCell: (params: GridRenderCellParams<Court>) => (
        <CourtLink chainId={chainId!} courtId={params.value as string} />
      ),
    },
    {
      field: 'tokenStaked',
      headerName: 'Total Staked',
      type: 'number',
      flex: 1,
      valueFormatter: (value: any) => {
        return formatPNK(value, true, true);
      },
    },
    {
      field: 'activeJurors',
      headerName: 'Active Jurors',
      type: 'number',
      flex: 1,
      valueFormatter: (value: any) => {
        return Number(value);
      },
    },
    {
      field: 'feeForJuror',
      headerName: 'Fee for Jurors',
      type: 'number',
      flex: 1,
      valueFormatter: (value: any) => {
        return formatAmount(value, chainId!);
      },
    },
    {
      field: 'minStake',
      headerName: 'Min Stake',
      type: 'number',
      flex: 1,
      valueFormatter: (value: any) => {
        return formatPNK(value);
      },
    },
    {
      field: 'voteStake',
      headerName: 'Vote Stake',
      flex: 1,
      renderCell: (params: GridRenderCellParams<Court>) => {
        return (
          (
            (Number(formatUnits(BigInt(String(params.row.minStake)), 18)) * Number(params.row.alpha)) /
            10000
          ).toLocaleString() + ' PNK'
        );
      },
    },
    {
      field: 'disputesNum',
      headerName: 'Total Disputes',
      type: 'number',
      flex: 1,
      valueFormatter: (value: any) => {
        return Number(value);
      },
    },
    {
      field: 'disputesOngoing',
      headerName: 'Open Disputes',
      type: 'number',
      flex: 1,
      valueFormatter: (value: any) => {
        return Number(value);
      },
    },
  ];

  return (
    <div>
      <Header logo={BALANCE} title="Courts" text="Learn more about the courts, stakes, jurors and other stats" />

      {
        <DataGrid<Court>
          rows={data ? data! : []}
          columns={columns}
          paginationModel={paginationModel}
          loading={isLoading}
          onPaginationModelChange={(model) => setPaginationModel(model)}
          pageSizeOptions={[10, 50, 100]}
          initialState={{
            sorting: { sortModel: [{ field: 'id', sort: 'asc' }] },
          }}
          disableRowSelectionOnClick
          autoHeight={true}
          slots={{
            footer: CustomFooter,
          }}
        />
      }
    </div>
  );
}

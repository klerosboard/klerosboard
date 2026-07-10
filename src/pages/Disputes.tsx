import React, { useState } from 'react';
import { useDisputes } from '../hooks/useDisputes';
import { formatDate } from '../lib/helpers';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { CustomFooter } from '../components/DataGridFooter';
import MobileDataGrid from '../components/MobileDataGrid';
import { Link as LinkRouter } from 'react-router-dom';
import { useChainId } from '../hooks/useChainId';
import { Link, Typography } from '@mui/material';
import Header from '../components/Header';
import { Court, Dispute } from '../graphql/subgraph';
import CourtLink from '../components/CourtLink';
import GAVEL from '../assets/icons/gavel_violet.png';

export default function Disputes() {
  const chainId = useChainId();
  const { data: disputes, isLoading } = useDisputes({ chainId: chainId! });
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  const columns: GridColDef<Dispute>[] = [
    {
      field: 'id',
      headerName: '#',
      flex: 1,
      type: 'number',
      renderCell: (params: GridRenderCellParams<Dispute, string>) => (
        <Link component={LinkRouter} to={`/${chainId}/cases/${params.value!}`} children={params.value!} />
      ),
    },
    {
      field: 'subcourtID',
      headerName: 'Court',
      flex: 2,
      renderCell: (params: GridRenderCellParams<Dispute, Court>) =>
        params.value ? (
          <CourtLink chainId={chainId!} courtId={params.value.id as string} />
        ) : (
          <Typography variant="body2">—</Typography>
        ),
    },
    {
      field: 'currentRulling',
      headerName: 'Current Ruling',
      flex: 1,
    },
    {
      field: 'period',
      headerName: 'Period',
      flex: 1,
      valueFormatter: (value: unknown) => {
        return (value as string).charAt(0).toUpperCase() + (value as string).slice(1);
      },
    },
    {
      field: 'lastPeriodChange',
      headerName: 'Last Period Change',
      flex: 1,
      valueFormatter: (value: unknown) => {
        return formatDate(value as number);
      },
    },
  ];

  return (
    <div>
      <Header logo={GAVEL} title="Disputes" text="Find all the cases created, its progress and stats." />

      {
        <MobileDataGrid<Dispute>
          rows={disputes ? disputes! : []}
          columns={columns}
          paginationModel={paginationModel}
          loading={isLoading}
          onPaginationModelChange={(model) => setPaginationModel(model)}
          pageSizeOptions={[10, 50, 100]}
          disableRowSelectionOnClick
          initialState={{
            sorting: { sortModel: [{ field: 'id', sort: 'desc' }] },
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

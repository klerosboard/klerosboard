import React, { useState } from 'react';
import { formatAmount, getCurrency } from '../lib/helpers';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { CustomFooter } from '../components/DataGridFooter';
import { Link, Skeleton, Typography } from '@mui/material';
import { Link as LinkRouter } from 'react-router-dom';
import { useChainId } from '../hooks/useChainId';
import Header from '../components/Header';
import { useArbitrables } from '../hooks/useArbitrables';
import ARBITRABLE from '../assets/icons/arbitrable_violet.png';
import { useArbitrablesNames } from '../hooks/useArbitrablesNames';
import { Arbitrable, LItem } from '../graphql/subgraph';
import { shortenIfAddress } from '../lib/utils';

function getArbitrableName(arbitrable: string, arbitrableNames: LItem[]): string {
  const foundItem = arbitrableNames.find((item) => item.key1?.toLowerCase() === arbitrable.toLowerCase());
  return foundItem ? foundItem.key0 : shortenIfAddress(arbitrable);
}

export default function Arbitrables() {
  const chainId = useChainId();
  const { data: arbitrables, isLoading } = useArbitrables(chainId!);
  const { data: arbitrablesNames } = useArbitrablesNames();
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const isArbitrum = chainId === '42161';
  const columns: GridColDef<Arbitrable>[] = [
    {
      field: 'id',
      headerName: 'Address',
      flex: 2,
      renderCell: (params: GridRenderCellParams<Arbitrable, string>) => (
        <Link component={LinkRouter} to={`/${chainId}/arbitrables/${params.value}`} children={params.value} />
      ),
    },
    {
      field: 'name',
      headerName: 'Name',
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
      field: 'disputesCount',
      headerName: 'Created Cases',
      flex: 1,
      type: 'number',
    },
    ...(isArbitrum
      ? []
      : [
          {
            field: 'ethFees',
            headerName: `Fees Generated [${getCurrency(chainId!)}]`,
            flex: 1,
            type: 'number',
            valueFormatter: (value: unknown) => {
              return formatAmount(value as number, chainId!);
            },
          },
        ]),
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
              sortModel: [{ field: isArbitrum ? 'disputesCount' : 'ethFees', sort: 'desc' }],
            },
          }}
        />
      }
    </div>
  );
}

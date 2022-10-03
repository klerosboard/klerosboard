import React, { useState } from 'react'
import { formatAmount, formatDate, getChainId } from '../lib/helpers';
import {
  DataGrid, GridRenderCellParams,
} from '@mui/x-data-grid'
import { CustomFooter } from '../components/DataGridFooter'
import { Link } from '@mui/material';
import { Link as LinkRouter, useSearchParams } from 'react-router-dom';
import { BigNumberish } from 'ethers';
import Header from '../components/Header';
import { useArbitrables } from '../hooks/useArbitrables';

export default function Arbitrables() {
  let [searchParams] = useSearchParams();
  const chainId = getChainId(searchParams);
  const { data: arbitrables, isLoading } = useArbitrables(chainId);
  const [pageSize, setPageSize] = useState<number>(10);

  const columns = [
    { field: 'id', headerName: 'Address', flex: 2, renderCell: (params: GridRenderCellParams<{value: string}>) => (
      <Link component={LinkRouter} to={'/arbitrables/' + params.value} children={params.value} />
    )},
    {
      field: 'name', headerName: 'Name', flex: 2
    },
    {
      field: 'disputesCount', headerName: 'Created Cases', flex: 1
    },
    { field: 'ethFees', headerName: 'Fess Generated', flex: 1, valueFormatter: (params:{value:BigNumberish}) => {
      return formatAmount(params.value, chainId);
    }},
  ];


  return (
    <div>
      <Header
        logo='../assets/icons/arbitrable_violet.png'
        title='Arbitrables Data'
        text='Check where the cases come from, and wich arbitrable contract have more leads.'
      />


      {<DataGrid
        rows={arbitrables ? arbitrables! : []}
        columns={columns}
        loading={isLoading}
        pageSize={pageSize}
        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
        rowsPerPageOptions={[10, 50, 100]}
        pagination
        disableSelectionOnClick
        autoHeight={true}
        components={{
          Footer: CustomFooter
        }}
      />}

    </div>
  )
}
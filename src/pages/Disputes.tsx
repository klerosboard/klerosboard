import React, { useState } from 'react'
import { useDisputes } from '../hooks/useDisputes'
import { formatDate, getChainId } from '../lib/helpers';
import {
  DataGrid, GridRenderCellParams,
} from '@mui/x-data-grid'
import { CustomFooter } from '../components/DataGridFooter'
import { Link as LinkRouter, useSearchParams } from 'react-router-dom';
import { Link } from '@mui/material';
import { BigNumberish } from 'ethers';
import Header from '../components/Header';
import { Court } from '../graphql/subgraph';
import CourtLink from '../components/CourtLink';
import GAVEL from '../assets/icons/gavel_violet.png';

export default function Disputes() {
  let [searchParams] = useSearchParams();
  const chainId = getChainId(searchParams);
  const { data: disputes, isLoading } = useDisputes(chainId);
  const [pageSize, setPageSize] = useState<number>(10);

  const columns = [
    {
      field: 'id', headerName: '#', flex: 1, renderCell: (params: GridRenderCellParams<string>) => (
        <Link component={LinkRouter} to={'/cases/' + params.value!} children={`#${params.value!}`} />
      )
    },
    {
      field: 'subcourtID', headerName: 'Court', flex: 2, renderCell: (params: GridRenderCellParams<Court>) => (
        <CourtLink chainId={chainId} courtId={params.value!.id as string} />
      )
    },
    {
      field: 'currentRulling', headerName: 'Current Ruling', flex: 1
    },
    { field: 'period', headerName: 'Period', flex: 1, valueFormatter: (params: { value: string }) => {
      return (params.value.charAt(0).toUpperCase() + params.value.slice(1)) 
    }},
    {
      field: 'lastPeriodChange', headerName: 'Last Period Change', flex: 1, valueFormatter: (params: { value: BigNumberish }) => {
        return formatDate(params.value as number);
      }
    }
  ];


  return (
    <div>
      <Header
        logo={GAVEL}
        title='Disputes'
        text='Find all the cases created, its progress and stats.'
      />


      {<DataGrid
        rows={disputes ? disputes! : []}
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
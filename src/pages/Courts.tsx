import React, { useState } from 'react'
import Header from '../components/Header';
import { useCourts } from '../hooks/useCourts'
import {
  DataGrid, GridToolbarContainer, GridToolbarExport, useGridApiContext, useGridSelector, gridPageCountSelector,
  gridPageSelector,
} from '@mui/x-data-grid'

import { Link, Pagination } from '@mui/material';
import { Link as LinkRouter, useSearchParams } from 'react-router-dom';
import { formatAmount, formatPNK, getChainId, getCourtName } from '../lib/helpers';
import { BigNumberish, ethers } from 'ethers';


function CustomFooter() {

  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);

  return (
    <>
    <GridToolbarContainer>
      <GridToolbarExport />
    </GridToolbarContainer>
    <Pagination
    color="primary"
    count={pageCount}
    page={page + 1}
    onChange={(event, value) => apiRef.current.setPage(value - 1)}
  />
  </>
  );
}


export default function Courts() {
  let [searchParams] = useSearchParams();
  const chainId = getChainId(searchParams);
  const { data: courts, isLoading } = useCourts();
  const [pageSize, setPageSize] = useState<number>(10);

  const columns = [
    { field: 'id', headerName: 'Court Id', flex: 1, valueFormatter: (params: { value: BigNumberish }) => { return Number(params.value) } },
    {
      field: 'name', headerName: 'Court Name', flex: 2, renderCell: (params: { id: BigNumberish }) => {
        return (<Link component={LinkRouter} to={'/courts/' + params.id} children={params.id} />);
      }
    },
    {
      field: 'tokenStaked', headerName: 'Total Staked', flex: 1, valueFormatter: (params: { value: BigNumberish }) => {
        const valueFormatted = Number(params.value).toLocaleString(undefined, { maximumFractionDigits: 0 });
        return `${valueFormatted}`;
      }
    },
    { field: 'activeJurors', headerName: 'Active Jurors', flex: 1, valueFormatter: (params: { value: BigNumberish }) => { return Number(params.value) } },
    {
      field: 'feeForJuror', headerName: 'Fee for Jurors', flex: 1, valueFormatter: (params: { value: BigNumberish }) => {
        return formatAmount(params.value, chainId);
      }
    },
    {
      field: 'minStake', headerName: 'Min Stake', flex: 1, valueFormatter: (params: { value: BigNumberish }) => {
        return formatPNK(params.value);
      }
    },
    {
      field: 'voteStake', headerName: 'Vote Stake', flex: 1, renderCell: (params: { row: { minStake: BigNumberish, alpha: BigNumberish } }) => {
        return ((Number(ethers.utils.formatUnits(params.row.minStake, 'ether')) * Number(params.row.alpha) / 10000).toLocaleString() + ' PNK');
      }
    },
    { field: 'disputesNum', headerName: 'Total Disputes', flex: 1, valueFormatter: (params: { value: BigNumberish }) => { return Number(params.value) } },
    { field: 'disputesOngoing', headerName: 'Open Disputes', flex: 1, valueFormatter: (params: { value: BigNumberish }) => { return Number(params.value) } },
  ];


  return (
    <div>
      <Header
        logo='../assets/icons/balance_violet.png'
        title='Courts'
        text='Learn more about the courts, stakes, jurors and other stats'
      />


      {<DataGrid
        rows={courts ? courts! : []}
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

import React, { useState } from 'react'
import Header from '../components/Header';
import { useCourts } from '../hooks/useCourts'
import { DataGrid, GridRenderCellParams } from '@mui/x-data-grid'

import { useSearchParams } from 'react-router-dom';
import { formatAmount, formatPNK, getChainId } from '../lib/helpers';
import { BigNumberish, ethers } from 'ethers';
import CourtLink from '../components/CourtLink';



export default function Courts() {
  let [searchParams] = useSearchParams();
  const chainId = getChainId(searchParams);
  const { data, isLoading } = useCourts(chainId);

  const [pageSize, setPageSize] = useState<number>(10);

  const columns = [
    { field: 'id', headerName: 'Court Id', flex: 1, valueFormatter: (params: { value: BigNumberish }) => { return Number(params.value) } },
    {
      field: 'subcourtID', headerName: 'Court Name', flex: 2, renderCell: (params: GridRenderCellParams<BigNumberish>) => (
        <CourtLink chainId={chainId} courtId={params.value! as string} />
      )
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
        rows={data ? data! : []}
        columns={columns}
        loading={isLoading}
        pageSize={pageSize}
        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
        rowsPerPageOptions={[10, 50, 100]}
        pagination
        disableSelectionOnClick
        autoHeight={true}
      />}

    </div>
  )
}

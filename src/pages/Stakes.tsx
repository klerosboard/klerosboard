import React, { useState } from 'react'
import { formatAmount, formatDate, formatPNK } from '../lib/helpers';
import {
  DataGrid, GridRenderCellParams,
} from '@mui/x-data-grid'
import { CustomFooter } from '../components/DataGridFooter'
import { Link } from '@mui/material';
import { Link as LinkRouter, useLocation } from 'react-router-dom';
import { BigNumberish } from '../lib/types';
import Header from '../components/Header';
import { useStakes } from '../hooks/useStakes';
import { Juror } from '../graphql/subgraph';
import { shortenAddress } from '../lib/utils';
import CourtLink from '../components/CourtLink';
import STAKES from '../assets/icons/icosahedron_violet.png';

export default function Stakes() {
  const location = useLocation();
  const match = location.pathname.match('(11155111|100|1)(?:/|$)')
  const chainId = match ? match[1] : null

  const { data: stakes, isLoading } = useStakes({chainId:chainId!});
  const [pageSize, setPageSize] = useState<number>(10);

   const columns = [
     {
       field: 'address', headerName: 'Juror', flex: 1, renderCell: (params: GridRenderCellParams<Juror>) => (
         <Link component={LinkRouter} to={`/${chainId}/profile/` + params.value!.id} children={shortenAddress(params.value!.id)} />
       )
     },
     {
       field: 'subcourtID', headerName: 'Court Name', flex: 2, renderCell: (params: GridRenderCellParams<BigNumberish>) => (
         <CourtLink chainId={chainId!} courtId={params.value! as string} />
       )
     },
     {
       field: 'stake', headerName: 'Last Stake', flex: 1, valueFormatter: (value: BigNumberish) => {
         return formatPNK(value);
       }
     },
     {
       field: 'newTotalStake', headerName: 'Total Staked', flex: 1, valueFormatter: (value: BigNumberish) => {
         return formatPNK(value);
       }
     },
     {
       field: 'timestamp', headerName: 'Date', flex: 1, valueFormatter: (value: BigNumberish) => {
         return formatDate(value as number);
       }
     },
     {
       field: 'gasCost', headerName: 'Gas Cost', flex: 1, valueFormatter: (value: BigNumberish) => {
         return formatAmount(value, chainId!);
       }
     },
   ];


  return (
    <div>
      <Header
        logo={STAKES}
        title='Stakes Data'
        text="Check all juror's stakes, the amount, date, court, and gas spent."
      />


       {<DataGrid
         rows={stakes ? stakes! : []}
         columns={columns}
         paginationModel={{ page: 0, pageSize }}
         loading={isLoading}
        onPaginationModelChange={(model) => setPageSize(model.pageSize)}
        pageSizeOptions={[10, 50, 100]}
        disableSelectionOnClick
         autoHeight={true}
         slots={{
           footer: CustomFooter
         }}
      />}

    </div>
  )
}
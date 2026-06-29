import React, { useState } from 'react'
import { formatAmount, formatDate, formatPNK } from '../lib/helpers';
import {
  DataGrid, GridColDef, GridRenderCellParams,
} from '@mui/x-data-grid'
import { CustomFooter } from '../components/DataGridFooter'
import { Link } from '@mui/material';
import { Link as LinkRouter } from 'react-router-dom';
import { useChainId } from '../hooks/useChainId';
import { BigNumberish } from '../lib/types';
import Header from '../components/Header';
import { useStakes } from '../hooks/useStakes';
import { Juror, StakeSet } from '../graphql/subgraph';
import { shortenAddress } from '../lib/utils';
import CourtLink from '../components/CourtLink';
import STAKES from '../assets/icons/icosahedron_violet.png';

export default function Stakes() {
  const chainId = useChainId();

  const { data: stakes, isLoading } = useStakes({chainId:chainId!});
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

   const columns: GridColDef<StakeSet>[] = [
     {
       field: 'address', headerName: 'Juror', flex: 1, renderCell: (params: GridRenderCellParams<StakeSet, { id: string }>) => (
         <Link component={LinkRouter} to={`/${chainId}/profile/` + params.value!.id} children={shortenAddress(params.value!.id)} />
       )
     },
     {
       field: 'subcourtID', headerName: 'Court Name', flex: 2, renderCell: (params: GridRenderCellParams<StakeSet>) => (
         <CourtLink chainId={chainId!} courtId={params.value as string} />
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


       {<DataGrid<StakeSet>
         rows={stakes ? stakes! : []}
         columns={columns}
          paginationModel={paginationModel}
          loading={isLoading}
         onPaginationModelChange={(model) => setPaginationModel(model)}
        pageSizeOptions={[10, 50, 100]}
         disableRowSelectionOnClick
         autoHeight={true}
         slots={{
           footer: CustomFooter
         }}
      />}

    </div>
  )
}

import React, { useState } from 'react'
import { useParams, Link as LinkRouter, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import { useArbitrable } from '../hooks/useArbitrable';
import { useArbitrableName } from '../hooks/useArbitrableName';
import { formatDate, getBlockExplorer } from '../lib/helpers';
import ARBITRABLE from '../assets/icons/arbitrable_violet.png'
import ARROW_RIGHT from '../assets/icons/arrow_right_blue.png'
import ArbitrableInfo from '../components/Arbitrable/ArbitrableInfo';
import { Skeleton, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Link } from '@mui/material';
import CourtLink from '../components/CourtLink';
import { CustomFooter } from '../components/DataGridFooter';
import { Court, Dispute } from '../graphql/subgraph';
import { useDisputes } from '../hooks/useDisputes';

export default function Arbitrable() {
  let { id } = useParams();
  const location = useLocation();
  const match = location.pathname.match('(11155111|100|1)(?:/|$)')
  const chainId = match ? match[1] : null

  const { data: arbitrable, isLoading } = useArbitrable(chainId!, id!);
  const { data: disputes, isLoading: isLoadingDisputes } = useDisputes({ chainId: chainId!, arbitrableID: id! });
  const { data: arbitrableName } = useArbitrableName(id!);
  const blockExplorer = getBlockExplorer(chainId!);
  const [pageSize, setPageSize] = useState<number>(10);

   const columns: GridColDef<Dispute>[] = [
     {
       field: 'id', headerName: 'Case #', flex: 1, renderCell: (params: GridRenderCellParams<Dispute, string>) => (
         <Link component={LinkRouter} to={`/${chainId}/cases/${params.value!}`} children={`#${params.value!}`} />
       )
     },
     {
       field: 'subcourtID', headerName: 'Court Name', flex: 2, renderCell: (params: GridRenderCellParams<Dispute, Court>) => (
         <CourtLink chainId={chainId!} courtId={params.value!.id as string} />
       )
     },
    {
      field: 'currentRulling', headerName: 'Current Ruling', flex: 1
    },
     {
       field: 'period', headerName: 'Period', flex: 1, valueFormatter: (value: any) => {
         return (value.charAt(0).toUpperCase() + value.slice(1))
       }
     },
     {
       field: 'lastPeriodChange', headerName: 'Last Period Change', flex: 1, valueFormatter: (value: any) => {
         return formatDate(value as number);
       }
     },
     {
       field: 'txid', headerName: 'txID', flex: 1, renderCell: (params: GridRenderCellParams<Dispute, string>) => (
         <a href={`${blockExplorer}/tx/${params.value}`} rel='noreferrer' target='_blank'>{`${params.value?.slice(0, 6)}...${params.value?.slice(-4)}`}</a>
       )
     }

  ];

  return (
    <div>
      <Header
        title={`Arbitrable: ${arbitrableName ?? id}`}
        logo={ARBITRABLE}
        text={
          <div style={{ alignItems: 'center', display: 'flex' }}>
            <a href={`${blockExplorer}/address/${id}`} target='_blank' rel='noreferrer'>
              View in block explorer&nbsp;
            </a>
            <img src={ARROW_RIGHT} height='16px' alt='arrow' />
          </div>}
      />


      {arbitrable && !isLoading ?
        <ArbitrableInfo chainId={chainId!} arbitrable={arbitrable} />
        : <Skeleton height='200px' width='100%' />}

      {disputes ?
         <>
           <Typography sx={{
             fontStyle: 'normal',
             fontWeight: 600,
             fontSize: '24px',
             lineHeight: '33px',
             color: '#333333',
             marginTop: '30px'
           }}>Cases Created</Typography>
           <DataGrid<Dispute>
             rows={disputes ? disputes! : []}
             columns={columns}
             paginationModel={{ page: 0, pageSize }}
             loading={isLoadingDisputes}
             onPaginationModelChange={(model) => setPageSize(model.pageSize)}
             pageSizeOptions={[10, 50, 100]}
             disableRowSelectionOnClick
             autoHeight={true}
             sx={{
               backgroundColor: '#FFFFFF',
               marginTop: '20px'
             }}
             slots={{
               footer: CustomFooter
             }}
           /></>
         : <Skeleton height='200px' width='100%' />
       }
    </div>
  )
}

import React, { useState } from 'react'
import { useParams, Link as LinkRouter, redirect, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import { useArbitrable } from '../hooks/useArbitrable';
import { useArbitrableName } from '../hooks/useArbitrableName';
import { formatDate, getBlockExplorer } from '../lib/helpers';
import ARBITRABLE from '../assets/icons/arbitrable_violet.png'
import ARROW_RIGHT from '../assets/icons/arrow_right_blue.png'
import ArbitrableInfo from '../components/Arbitrable/ArbitrableInfo';
import { Skeleton, Typography } from '@mui/material';
import { DataGrid, GridRenderCellParams } from '@mui/x-data-grid';
import { Link } from '@mui/material';
import { BigNumberish } from 'ethers';
import CourtLink from '../components/CourtLink';
import { CustomFooter } from '../components/DataGridFooter';
import { Court } from '../graphql/subgraph';
import { useDisputes } from '../hooks/useDisputes';

export default function Arbitrable() {
  let { id } = useParams();
  const location = useLocation();
  const match = location.pathname.match('(100|1)(?:/|$)')
  const chainId = match ? match[1] : null
  if (!!chainId) redirect('/not-found')

  const { data: arbitrable, isLoading } = useArbitrable(chainId!, id!);
  const { data: disputes, isLoading: isLoadingDisputes } = useDisputes({ chainId: chainId!, arbitrableID: id! });
  const { data: arbitrableName } = useArbitrableName(id!);
  const blockExplorer = getBlockExplorer(chainId!);
  const [pageSize, setPageSize] = useState<number>(10);

  const columns = [
    {
      field: 'id', headerName: 'Case #', flex: 1, renderCell: (params: GridRenderCellParams<string>) => (
        <Link component={LinkRouter} to={`/${chainId}/cases/${params.value!}`} children={`#${params.value!}`} />
      )
    },
    {
      field: 'subcourtID', headerName: 'Court Name', flex: 2, renderCell: (params: GridRenderCellParams<Court>) => (
        <CourtLink chainId={chainId!} courtId={params.value!.id as string} />
      )
    },
    {
      field: 'currentRulling', headerName: 'Current Ruling', flex: 1
    },
    {
      field: 'period', headerName: 'Period', flex: 1, valueFormatter: (params: { value: string }) => {
        return (params.value.charAt(0).toUpperCase() + params.value.slice(1))
      }
    },
    {
      field: 'lastPeriodChange', headerName: 'Last Period Change', flex: 1, valueFormatter: (params: { value: BigNumberish }) => {
        return formatDate(params.value as number);
      }
    },
    {
      field: 'txid', headerName: 'txID', flex: 1, renderCell: (params: GridRenderCellParams<string>) => (
        <a href={`${blockExplorer}/txid/${params.value}`} rel='noreferrer' target='_blank'>{`${params.value?.slice(0, 6)}...${params.value?.slice(-4)}`}</a>
      )
    }

  ];

  return (
    <div>
      <Header
        title={`Arbitrable:${arbitrableName? arbitrableName! : 'Loading...'}`}
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
          <DataGrid
            rows={disputes ? disputes! : []}
            columns={columns}
            loading={isLoadingDisputes}
            pageSize={pageSize}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            rowsPerPageOptions={[10, 50, 100]}
            pagination
            disableSelectionOnClick
            autoHeight={true}
            sx={{
              backgroundColor: '#FFFFFF',
              marginTop: '20px'
            }}
            components={{
              Footer: CustomFooter
            }}
          /></>
        : <Skeleton height='200px' width='100%' />
      }
    </div>
  )
}

import { Box, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { BigNumberish } from '../lib/types';
import React from 'react'
import { Court, Dispute } from '../graphql/subgraph';
import { useDisputes } from '../hooks/useDisputes';
import { formatDate, getPeriodNumber } from '../lib/helpers';
import CourtLink from './CourtLink';
import { Link } from '@mui/material';
import { Link as LinkRouter } from 'react-router-dom';
import { CustomFooter } from './DataGridFooter';

interface Props {
    chainId: string
    courtId: string | undefined
    courtRendering?: boolean
    hideFooter?: boolean
}

export default function LatestDisputes(props: Props) {
    const { data: disputes, isLoading: disputes_loading } = useDisputes({chainId: props.chainId, subcourtID: props.courtId});

     const dispute_columns: GridColDef<Dispute>[] = [
         { field: 'id', headerName: '#', flex: 1, renderCell: (params: GridRenderCellParams<Dispute, string>) => (
             <Link component={LinkRouter} to={`/${props.chainId}/cases/${params.value}`} children={params.value} />
         ) },
         {
             field: 'subcourtID', headerName: 'Court', flex: 2, renderCell: (params: GridRenderCellParams<Dispute, Court>) => (
                 <CourtLink chainId={props.chainId} courtId={params.value!.id as string} />
             )
         },
        {
            field: 'currentRulling', headerName: 'Current Ruling', flex: 1
        },
         { field: 'period', headerName: 'Period', flex: 1, valueFormatter: (value: any) => {
             return typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1) : (value ?? '')
         }}
     ];
     const dispute_columns_court: GridColDef<Dispute>[] = [
         { field: 'id', headerName: '#', flex: 1, renderCell: (params: GridRenderCellParams<Dispute, string>) => (
             <Link component={LinkRouter} to={`/${props.chainId}/cases/${params.value}`} children={params.value} />
         ) },
          { field: 'period', headerName: 'Period', flex: 1, valueFormatter: (value: any) => {
              return typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1) : (value ?? '')
          }
          },
         {
             field: 'lastPeriodChange', headerName: 'Last period Change', flex: 2, renderCell: (params: GridRenderCellParams<Dispute, BigNumberish>) => (
                 formatDate(Number(params.value!))
             )
         },
         {
             field: 'subcourtID', headerName: 'Period Ends', flex: 2, renderCell: (params: GridRenderCellParams<Dispute, Court>) => {
                 if (params.row.period !== 'execution') {
                     return formatDate(Number(params.row.lastPeriodChange) + Number(params.value!.timePeriods[getPeriodNumber(params.row.period)]))
                 }
                 return formatDate(Number(params.row.lastPeriodChange))
             }
         },
        

    ];

    return (
        <Box>

            <Typography sx={{ fontSize: '24px', fontWeight: 600, fontStyle: 'normal' }}>Latest Cases</Typography>
            {<DataGrid<Dispute>
                sx={{ marginTop: '30px' }}
                rows={disputes ? disputes! : []}
                columns={props.courtRendering ? dispute_columns_court : dispute_columns}
                loading={disputes_loading}
                paginationModel={{ page: 0, pageSize: 10 }}
                disableRowSelectionOnClick
                autoHeight={true}
                hideFooter={props.hideFooter === undefined? true: props.hideFooter}
                 slots={{
                  footer: CustomFooter
                }}
            />}
        </Box>

    )
}

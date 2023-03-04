import { Box, Typography } from '@mui/material';
import { DataGrid, GridRenderCellParams } from '@mui/x-data-grid';
import { BigNumberish } from 'ethers';
import React from 'react'
import { Court } from '../graphql/subgraph';
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

    const dispute_columns = [
        { field: 'id', headerName: '#', flex: 1,renderCell: (params: GridRenderCellParams<Court>) => (
            <Link component={LinkRouter} to={`/${props.chainId}/cases/${params.value}`} children={params.value} />
        ) },
        {
            field: 'subcourtID', headerName: 'Court', flex: 2, renderCell: (params: GridRenderCellParams<Court>) => (
                <CourtLink chainId={props.chainId} courtId={params.value!.id as string} />
            )
        },
        {
            field: 'currentRulling', headerName: 'Current Ruling', flex: 1
        },
        { field: 'period', headerName: 'Period', flex: 1, valueFormatter: (params: { value: string }) => {
            return (params.value.charAt(0).toUpperCase() + params.value.slice(1))
        }}
    ];
    const dispute_columns_court = [
        { field: 'id', headerName: '#', flex: 1,renderCell: (params: GridRenderCellParams<string>) => (
            <Link component={LinkRouter} to={`/${props.chainId}/cases/${params.value}`} children={params.value} />
        ) },
        { field: 'period', headerName: 'Period', flex: 1, valueFormatter: (params: { value: string }) => {
            return (params.value.charAt(0).toUpperCase() + params.value.slice(1))
        }
        },
        {
            field: 'lastPeriodChange', headerName: 'Last period Change', flex: 2, renderCell: (params: GridRenderCellParams<BigNumberish>) => (
                formatDate(Number(params.value!))
            )
        },
        {
            field: 'subcourtID', headerName: 'Period Ends', flex: 2, renderCell: (params: GridRenderCellParams<Court>) => {
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
            {<DataGrid
                sx={{ marginTop: '30px' }}
                rows={disputes ? disputes! : []}
                columns={props.courtRendering ? dispute_columns_court : dispute_columns}
                loading={disputes_loading}
                pageSize={10}
                disableSelectionOnClick
                autoHeight={true}
                hideFooter={props.hideFooter === undefined? true: props.hideFooter}
                components={{
                  Footer: CustomFooter
                }}
            />}
        </Box>

    )
}

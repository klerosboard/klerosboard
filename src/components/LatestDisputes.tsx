import { Box, Typography } from '@mui/material';
import { DataGrid, GridRenderCellParams } from '@mui/x-data-grid';
import React from 'react'
import { Court } from '../graphql/subgraph';
import { useDisputes } from '../hooks/useDisputes';
import CourtLink from './CourtLink';

interface Props {
    chainId: string
    courtId?: string
}

export default function LatestDisputes(props: Props) {
    const { data: disputes, isLoading: disputes_loading } = useDisputes(props.chainId, props.courtId);
    const dispute_columns = [
        { field: 'id', headerName: '#', flex: 1 },
        {
            field: 'subcourtID', headerName: 'Court', flex: 2, renderCell: (params: GridRenderCellParams<Court>) => (
                <CourtLink chainId={props.chainId} courtId={params.value!.id as string} />
            )
        },
        {
            field: 'currentRulling', headerName: 'Current Ruling', flex: 1
        },
        { field: 'period', headerName: 'Period', flex: 1 },

    ];

    return (
        <Box>

            <Typography sx={{ fontSize: '24px', fontWeight: 600, fontStyle: 'normal' }}>Latest Cases</Typography>
            {<DataGrid
                sx={{ marginTop: '30px' }}
                rows={disputes ? disputes! : []}
                columns={dispute_columns}
                loading={disputes_loading}
                pageSize={10}
                disableSelectionOnClick
                autoHeight={true}
                hideFooter={true}
            />}
        </Box>

    )
}

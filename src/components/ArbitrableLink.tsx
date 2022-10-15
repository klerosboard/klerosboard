import React from 'react'
import { Link } from '@mui/material';
import { Link as LinkRouter } from 'react-router-dom';
import { useArbitrableName } from '../hooks/useArbitrableName';


interface Props {
    chainId: string;
    id: string;
}

export default function ArbitrableLink(props: Props) {
    const name = useArbitrableName(props.chainId, props.id)

    // Todo: Add Avatar
    return <Link component={LinkRouter} to={`/${props.chainId!}/arbitrables/${props.id}`} children={name} sx={{
        fontStyle: 'normal',
        fontWeight: 400,
        fontSize: '14px',
        lineHeight: '19px'
    }} />
}

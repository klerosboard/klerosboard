import React from 'react'
import { Link } from '@mui/material';
import { Link as LinkRouter } from 'react-router-dom';
import { shortenAddress } from '@usedapp/core';


interface Props {
    chainId: string;
    address: string;
}

export default function JurorLink(props:Props) {
    // Todo: Add Avatar
    return <Link component={LinkRouter} to={`/${props.chainId}/profile/${props.address}`} children={shortenAddress(props.address)} />
}

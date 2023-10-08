import React from 'react'
import { Navigate, useSearchParams } from "react-router-dom";


export default function RedirectDispute() {
    let [searchParams,] = useSearchParams();
    const disputeId = searchParams.get('id');
    const network = searchParams.get('network');
    let chainId = 1;
    if (network === 'xdai') {
        chainId = 100;
    }

    if (disputeId !== undefined && disputeId !== null) {
        return (
        <Navigate to={`/${chainId}/cases/${disputeId}`} replace />
        )
    }
    return (
        <Navigate to={`/${chainId}/cases`} replace />
    )
}

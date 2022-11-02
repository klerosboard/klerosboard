import React, { useEffect, useState } from 'react'
import { Link, Skeleton } from '@mui/material';
import { Link as LinkRouter } from 'react-router-dom';
import { getCourtName } from '../lib/helpers';


interface Props {
    chainId: string;
    courtId: string;
}

export default function CourtLink(props:Props) {
    const [courtName, setCourtName] = useState<string | undefined>(undefined);

    useEffect(() => {

        const fetchName = async (courtId: string, chainId: string) => {
            const name = await getCourtName(chainId, courtId)
            setCourtName(name);
        };

        if (props.courtId && courtName === undefined) {
            // console.log(data)
            fetchName(props.courtId, props.chainId);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.courtId, props.chainId]);

    if (courtName) {
        return <Link component={LinkRouter} to={`/${props.chainId}/courts/${props.courtId}`} children={courtName} />
    }
    return <Skeleton />

}

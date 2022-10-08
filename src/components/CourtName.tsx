import React, { useEffect, useState } from 'react'
import { getCourtName } from '../lib/helpers';

export default function CourtName({chainId, courtId}: {chainId: string, courtId: string}) {
    const [courtName, setCourtName] = useState<string | undefined>(undefined);

    useEffect(() => {

        const fetchName = async (courtId: string, chainId: string) => {
            const name = await getCourtName(chainId, courtId)
            setCourtName(name);
        };

        if (courtId && courtName === undefined) {
            // console.log(data)
            fetchName(courtId, chainId);
        }
    }, [courtId, chainId, courtName]);

    return courtName
}

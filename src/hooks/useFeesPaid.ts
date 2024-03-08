import { useEffect, useState } from "react";
import { KLEROS_STATS_API } from "../lib/helpers";
import { FeesPaid } from "../lib/types";


export const useFeesPaid = (chainId:string) => {
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<FeesPaid|undefined>(undefined);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            const parameters = {
                'freq': 'M',
            }
            var url = new URL(KLEROS_STATS_API + `history/fees/${chainId}`)
            url.search = new URLSearchParams(parameters).toString()
            const response = await fetch(url)
            setIsLoading(false)
            const responseData = await response.json()
            setData(JSON.parse(responseData['data']))
        }

        fetchData();
    }, [chainId]);

    return { data, isLoading };
};
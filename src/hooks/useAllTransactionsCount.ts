import { useEffect, useState } from "react";
import { KLEROS_STATS_API } from "../lib/helpers";
import { TimestampCounter } from "../lib/types";


export const useAllTransactionsCount = (chainId:string) => {
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<TimestampCounter|undefined>(undefined);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            const parameters = {
                'freq': 'M',
            }
            var url = new URL(KLEROS_STATS_API + `history/transactions/${chainId}`)
            url.search = new URLSearchParams(parameters).toString()
            const response = await fetch(url)
            setIsLoading(false)
            const responseData = await response.json()
            setData(JSON.parse(responseData['data'])['tx'])
        }

        fetchData();
    }, [chainId]);

    return { data, isLoading };
};
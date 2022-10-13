import { useEffect, useState } from "react";

const COINGECKO_API = 'https://api.coingecko.com/api/v3/'

interface MarketData {
    price_change_24h: number, /// USD
    price_change_percentage_24h: number
    total_volume: number // USD
    current_price: number // USD
    circulating_supply: number  // USD
    total_supply: number  // USD

}

export const useTokenInfo = (tokenId:string) => {
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<MarketData|undefined>(undefined);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)

            const parameters = {
                'localization': 'false',
                'tickers': 'false',
                'market_data': 'true',
                'community_data': 'false',
                'developer_data': 'false',
                'sparkline': 'false'
            }

            var url = new URL(COINGECKO_API + `coins/${tokenId}`)
            url.search = new URLSearchParams(parameters).toString()
            const response = await fetch(url)
            setIsLoading(false)
            const responseData = await response.json()
            setData({
                price_change_24h: responseData['market_data']['price_change_24h'],
                price_change_percentage_24h: responseData['market_data']['price_change_percentage_24h'],
                total_volume: responseData['market_data']['total_volume']['usd'],
                total_supply: responseData['market_data']['total_supply'],
                circulating_supply: responseData['market_data']['circulating_supply'],
                current_price: responseData['market_data']['current_price']['usd']
            })
        }

        fetchData();
    }, [tokenId]);

    return { data, isLoading };
};
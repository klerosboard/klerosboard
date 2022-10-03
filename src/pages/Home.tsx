import React from 'react'
import { useSearchParams } from 'react-router-dom';
import { useKlerosCounter } from '../hooks/useKlerosCounters'
import { getChainId } from '../lib/helpers';

export default function Home() {
  let [searchParams] = useSearchParams();
  const chainId = getChainId(searchParams)
  const {data} = useKlerosCounter(chainId);
  console.log(data);
  return (
    <div>
      {data? 'Yeay': 'No no no no'}
    </div>
  )
}

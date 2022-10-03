import React from 'react'
import { useParams, useSearchParams } from 'react-router-dom';
import { useDispute } from '../hooks/useDispute'
import { getChainId } from '../lib/helpers';

export default function Dispute() {
  let [searchParams] = useSearchParams();
  const chainId = getChainId(searchParams)
  let { id } = useParams();
  const {data} = useDispute(chainId, id!)

  return (
    <div>
      Dispute
      {data? 'Yeay': 'nonono'}
    </div>
  )
}

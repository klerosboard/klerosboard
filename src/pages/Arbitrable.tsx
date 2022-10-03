import React from 'react'
import { useParams, useSearchParams } from 'react-router-dom';
import { useArbitrable } from '../hooks/useArbitrable';
import { getChainId } from '../lib/helpers';

export default function Arbitrable() {
  let [searchParams] = useSearchParams();
  const chainId = getChainId(searchParams)
  let { id } = useParams();
  const {data} = useArbitrable(chainId, id!)

  return (
    <div>
      {data? 'Arbitrable Data loaded': 'Error'}
    </div>
  )
}

import React from 'react'
import Header from '../components/Header'
import COMMUNITY from '../assets/icons/community_violet.png'
import ARROW_RIGHT from '../assets/icons/arrow_right_blue.png'
import { useParams, useSearchParams } from 'react-router-dom';
import { getBlockExplorer, getChainId } from '../lib/helpers';
import { shortenAddress } from '@usedapp/core';
import { useProfile } from '../hooks/useProfile';
import ProfileStats from '../components/Profile/ProfileStats';
import { Skeleton } from '@mui/material';
import { useDisputes } from '../hooks/useDisputes';
import CreatedCases from '../components/Profile/CreatedCases';
import VotedCases from '../components/Profile/VotedCases';
import { useVotes } from '../hooks/useVotes';
import LatestStakes from '../components/LatestStakes';

export default function Profile() {
  let [searchParams] = useSearchParams();
  const chainId = getChainId(searchParams);
  let { id } = useParams();
  const blockExplorer = getBlockExplorer(chainId);
  
  const {data: profile} = useProfile(chainId, id!);
  const {data: cases, isLoading: isLoadingCases} = useDisputes({chainId:chainId, creator:id!})
  const {data: votes, isLoading: isLoadingVotes} = useVotes({chainId:chainId, jurorID:id!})

  return (
    <div>
      <Header
        title={'Profile: ' + shortenAddress(id!)}
        // TODO: change to avatar
        logo={COMMUNITY}
        text={
          <div style={{ alignItems: 'center', display: 'flex' }}>
            <a href={`${blockExplorer}/address/${id}`} target='_blank' rel='noreferrer'>
              View in block explorer&nbsp;
            </a>
            <img src={ARROW_RIGHT} height='16px' alt='arrow' />
          </div>}
      />

    {
      profile ? 
      <ProfileStats profile={profile!} chainId={chainId} />
      : <Skeleton width='100%' height='200px' />
    }


    <CreatedCases chainId={chainId} cases={cases} isLoading={isLoadingCases}/>
    <LatestStakes chainId={chainId} jurorId={id} hideFooter={false}/>
    <VotedCases chainId={chainId} votes={votes} isLoading={isLoadingVotes}/>
    
      
    </div>
  )
}

import React from 'react'
import Header from '../components/Header';
import COMMUNITY from '../assets/icons/community_violet.png';
import RowLinks from '../components/RowLinks';

export default function Community() {
  return (
    <div>
      <Header
        logo={COMMUNITY}
        title='Kleros Family'
        text='Join the community map and be part of Kleros Family.'
      />

      {/* Todo: add the map  */}


    <RowLinks />

    </div>
  )
}

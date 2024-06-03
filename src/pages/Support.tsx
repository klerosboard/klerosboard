import Header from '../components/Header'
import HEART from '../assets/icons/heart_violet.png';
import { Donor } from '../graphql/subgraph';


export default function Support() {
  return (
    <div>
      <Header
        logo={HEART}
        title='Support Klerosboard with donations!'
        text='Klerosboard is a community-created tool developed by @kokialgo to provide metrics, statistics, and insights about Kleros.'
      />
    </div>
  )
}

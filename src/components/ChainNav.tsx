import PublicIcon from '@mui/icons-material/Public';
import { Box, Button } from '@mui/material';
import { Link as LinkRouter } from 'react-router-dom';
import arbitrum_logo from '../assets/logos/arbitrum.png';
import ethereum_logo from '../assets/logos/ethereum.png';
import gnosis_logo from '../assets/logos/gnosis.png';

const CHAINS = [
  { label: 'Ethereum', chainId: '1', logo: ethereum_logo },
  { label: 'Gnosis', chainId: '100', logo: gnosis_logo },
  { label: 'Arbitrum', chainId: '42161', logo: arbitrum_logo },
];

interface Props {
  /** Current chainId (e.g. '1', '100', '42161') or undefined/empty on aggregated view. */
  currentChainId?: string;
}

export default function ChainNav({ currentChainId }: Props) {
  const isAggregated = !currentChainId;

  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
      <Button
        component={LinkRouter}
        to="/aggregated-charts"
        variant={isAggregated ? 'contained' : 'outlined'}
        size="small"
        startIcon={<PublicIcon />}
        sx={{ textTransform: 'none', borderRadius: '20px' }}
      >
        All Chains
      </Button>
      {CHAINS.map(({ label, chainId, logo }) => (
        <Button
          key={chainId}
          component={LinkRouter}
          to={`/${chainId}/`}
          variant={currentChainId === chainId ? 'contained' : 'outlined'}
          size="small"
          startIcon={<img src={logo} alt={label} height="16px" />}
          sx={{ textTransform: 'none', borderRadius: '20px' }}
        >
          {label}
        </Button>
      ))}
    </Box>
  );
}

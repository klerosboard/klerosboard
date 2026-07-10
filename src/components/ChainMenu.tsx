import { Fragment, useState } from 'react';
import Box from '@mui/material/Box';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { Link, Typography, useMediaQuery } from '@mui/material';
import { Link as LinkRouter, Location, useLocation } from 'react-router-dom';
import gnosis from '../assets/logos/gnosis.png';
import ethereum from '../assets/logos/ethereum.png';
import sepolia from '../assets/logos/ethereum.png';
import arbitrum from '../assets/logos/arbitrum.png';
import { useTheme } from '@mui/material/styles';

function changeChainIdFromLocation(location: Location, newChainId: string): string {
  const pathname = location.pathname;
  const index = pathname.indexOf('/', 1); // to avoid the first slash

  if (index === -1) return `/${newChainId}`;
  if (pathname.includes('cases')) return `/${newChainId}/cases`; // if changing network from a case, return to All Cases view.
  return `/${newChainId}/${pathname.slice(index + 1)}`;
}

export default function ChainMenu({ chainId }: { chainId: string }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();

  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const eth_logo = <img src={ethereum} alt="ethereum network" height={'20px'} />;
  const gnosis_logo = (
    <>
      <img src={gnosis} alt="gnosis network" height={'20px'} />
    </>
  );
  const sepolia_logo = <img src={sepolia} alt="sepolia testnet" height={'20px'} />;
  const arbitrum_logo = <img src={arbitrum} alt="arbitrum network" height={'20px'} />;

  return (
    <Fragment>
      <Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
        <Tooltip title="Chain Settings">
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{
              ml: 2,
              borderRadius: '300px',
            }}
            aria-controls={open ? 'chain-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            {chainId === '1' ? (
              <>
                {eth_logo}
                {!mobile ? (
                  <Typography
                    sx={{
                      color: 'text.primary',
                      fontFamily: 'Open Sans',
                      fontSize: '14px',
                      fontWeight: 400,
                      lineHeight: 1,
                      letterSpacing: 0,
                    }}
                  >
                    Ethereum Mainnet
                  </Typography>
                ) : null}
              </>
            ) : chainId === '11155111' ? (
              <>
                {sepolia_logo}
                {!mobile ? (
                  <Typography
                    sx={{
                      color: 'text.primary',
                      fontFamily: 'Open Sans',
                      fontSize: '14px',
                      fontWeight: 400,
                      lineHeight: 1,
                      letterSpacing: 0,
                    }}
                  >
                    Sepolia Testnet
                  </Typography>
                ) : null}
              </>
            ) : chainId === '42161' ? (
              <>
                {arbitrum_logo}
                {!mobile ? (
                  <Typography
                    sx={{
                      color: 'text.primary',
                      fontFamily: 'Open Sans',
                      fontSize: '14px',
                      fontWeight: 400,
                      lineHeight: 1,
                      letterSpacing: 0,
                    }}
                  >
                    Arbitrum One
                  </Typography>
                ) : null}
              </>
            ) : (
              <>
                {gnosis_logo}
                {!mobile ? (
                  <Typography
                    sx={{
                      color: 'text.primary',
                      fontFamily: 'Open Sans',
                      fontSize: '14px',
                      fontWeight: 400,
                      lineHeight: 1,
                      letterSpacing: 0,
                    }}
                  >
                    Gnosis (xDAI)
                  </Typography>
                ) : null}
              </>
            )}
          </IconButton>
        </Tooltip>
      </Box>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: 'visible',
              mt: 1.5,
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          sx={{
            '&:hover': {
              background: 'secondary.dark',
              borderLeft: '3px solid',
              borderLeftColor: 'primary.main',
            },
          }}
        >
          <Link to={changeChainIdFromLocation(location, '1')} component={LinkRouter}>
            {eth_logo}
            <Typography
              sx={{
                color: 'text.primary',
                fontFamily: 'Open Sans',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: 1,
                letterSpacing: 0,
              }}
            >
              Ethereum Mainnet
            </Typography>{' '}
          </Link>
        </MenuItem>

        <MenuItem
          sx={{
            '&:hover': {
              background: 'secondary.dark',
              borderLeft: '3px solid',
              borderLeftColor: 'primary.main',
            },
          }}
        >
          <Link to={changeChainIdFromLocation(location, '100')} component={LinkRouter}>
            {gnosis_logo}{' '}
            <Typography
              sx={{
                color: 'text.primary',
                fontFamily: 'Open Sans',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: 1,
                letterSpacing: 0,
              }}
            >
              Gnosis (xDAI)
            </Typography>{' '}
          </Link>
        </MenuItem>

        <MenuItem
          sx={{
            '&:hover': {
              background: 'secondary.dark',
              borderLeft: '3px solid',
              borderLeftColor: 'primary.main',
            },
          }}
        >
          <Link to={changeChainIdFromLocation(location, '42161')} component={LinkRouter}>
            {arbitrum_logo}{' '}
            <Typography
              sx={{
                color: 'text.primary',
                fontFamily: 'Open Sans',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: 1,
                letterSpacing: 0,
              }}
            >
              Arbitrum One
            </Typography>{' '}
          </Link>
        </MenuItem>
      </Menu>
    </Fragment>
  );
}

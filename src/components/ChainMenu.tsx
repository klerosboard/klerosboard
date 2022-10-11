import { Fragment, useState } from 'react';
import Box from '@mui/material/Box';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { Link, Typography } from '@mui/material';
import { Link as LinkRouter } from 'react-router-dom';
import gnosis from '../assets/logos/gnosis.png'
import ethereum from '../assets/logos/ethereum.png'
import { useTheme } from '@mui/system';


export default function ChainMenu({ chainId }: { chainId: string }) {

    const [anchorEl, setAnchorEl] = useState(null);
    const theme = useTheme();
    const open = Boolean(anchorEl);
    const handleClick = (event: any) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const eth_logo = <><img src={ethereum} alt='ethereum network' height={'20px'} /><Typography color={theme.palette.primary.light}>Ethereum Mainnet</Typography></>
    const gnosis_logo = <><img src={gnosis} alt='gnosis network' height={'20px'} /><Typography color={theme.palette.primary.light}>Gnosis (xDAI)</Typography></>

    return (
        <Fragment>
            <Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center', }}>
                <Tooltip title="Chain Settings">
                    <IconButton
                        onClick={handleClick}
                        size="small"
                        sx={{ ml: 2 }}
                        aria-controls={open ? 'chain-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                    >
                        {chainId === '1' ? eth_logo : gnosis_logo} <Typography color={theme.palette.primary.main}>  Network</Typography>
                    </IconButton>
                </Tooltip>
            </Box>
            <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                    elevation: 0,
                    sx: {
                        overflow: 'visible',
                        mt: 1.5,
                        borderRadius: '3px',
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
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem sx={{
                    '&:hover': {
                        background: '#F0F9FF',
                        borderLeft: '3px solid #009AFF',
                    }
                }}>
                    <Link to="?chainId=1" component={LinkRouter}>
                        {eth_logo}
                    </Link>
                </MenuItem>

                <MenuItem sx={{
                    '&:hover': {
                        background: '#F0F9FF',
                        borderLeft: '3px solid #009AFF',
                    }
                }}>
                    <Link to="?chainId=100" component={LinkRouter}>
                        {gnosis_logo}
                    </Link>
                </MenuItem>

            </Menu>
        </Fragment>
    );
}
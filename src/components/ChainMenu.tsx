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


const eth_logo = <><img src={ethereum} alt='ethereum network' height={'20px'} /> Mainnet </>
const gnosis_logo = <><img src={gnosis} alt='gnosis network' height={'20px'} /> Gnosis </>

export default function ChainMenu({chainId}: {chainId:string}) {

    const [anchorEl, setAnchorEl] = useState(null);
    const theme = useTheme();
    const open = Boolean(anchorEl);
    const handleClick = (event: any) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    return (
        <Fragment>
            <Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
                <Tooltip title="Chain Settings">
                    <IconButton
                        onClick={handleClick}
                        size="small"
                        sx={{ ml: 2 }}
                        aria-controls={open ? 'chain-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                    >
                        {chainId === '1' ? eth_logo : gnosis_logo} <Typography color={theme.palette.primary.main}> Network</Typography>
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
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 1.5,
                        '& .MuiAvatar-root': {
                            width: 32,
                            height: 32,
                            ml: -0.5,
                            mr: 1,
                        },
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
                <MenuItem>
                    <Link to="?chainId=1" component={LinkRouter}>
                        {eth_logo}
                    </Link>
                </MenuItem>

                <MenuItem>
                    <Link to="?chainId=100" component={LinkRouter}>
                        {gnosis_logo}
                    </Link>
                </MenuItem>

            </Menu>
        </Fragment>
    );
}
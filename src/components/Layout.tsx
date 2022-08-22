import { useState, useMemo } from "react";
import {
  Link as RouterLink,
  Outlet,
  useSearchParams,
} from "react-router-dom";

import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import { Box, Toolbar, List, Divider, IconButton, Badge, Typography, Container, Tooltip } from "@mui/material";
import { Favorite, ChevronLeft, Notifications } from "@mui/icons-material";

import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Logo from "../assets/logo.png"


import ChainMenu from "./ChainMenu";
import { getChainId } from "../lib/helpers";
import { mainListItems, secondaryListItems, footerListItems } from '../lib/sideMenuItems';
import Footer from "./Footer";

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [themeMode, setMode] = useState('dark');
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  const theme = useTheme();
  let [searchParams] = useSearchParams();
  let chainId = getChainId(searchParams)

  const toggleDrawer = () => {
    setOpen(!open);
  };


  return (
    <>
      <Drawer variant="permanent" open={open}>
        <Toolbar />
        <DrawerHeader sx={{ ...(!open && { display: 'none' }) }}>
          <IconButton onClick={toggleDrawer}>
            <ChevronLeft />
            <Typography color={theme.palette.secondary.main}>Klerosboard</Typography>
            <img src={Logo} width='30px' alt="Klerosboard" />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List component="nav">
          {mainListItems}
          <Divider sx={{ my: 1, background: '#4D00B4' }} />
          {secondaryListItems}
        </List>

        <List component="nav" sx={{
          marginTop: 'auto'
        }}>
          <Divider sx={{ my: 1, background: '#4D00B4' }} />
          {footerListItems}
        </List>
      </Drawer>


      {/* Content Display */}

      <AppBar position="absolute" open={open} >
        <Toolbar
          sx={{
            mr: '24px', // keep right padding when drawer closed
          }}
        >

          {/* Klerosboard */}
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer}
            sx={{
              marginRight: '36px',
              ...(open && { display: 'none' }),
            }}
          >
            <img src={Logo} width='30px' alt="Klerosboard" />
          </IconButton>


          {/* Chain changer */}
          <ChainMenu chainId={chainId} />

          {/* Support */}
          <Tooltip title="Support">
            <IconButton color="inherit" size='small' component={RouterLink} to="/support" children={<Favorite />} />
          </Tooltip>

          {/* Notifications */}
          <IconButton color="inherit">
            <Badge badgeContent={4} color="secondary">
              <Notifications />
            </Badge>
          </IconButton>

          {/* Theme mode switch */}
          <Tooltip title={theme.palette.mode + " mode"}>
            <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>

        </Toolbar>
      </AppBar>
      <Container sx={{ mr: '24px' }}>
        <Toolbar />
        <Outlet />
        <Footer />
      </Container>

    </>

  );
};

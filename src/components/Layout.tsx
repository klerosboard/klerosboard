import { useState, useMemo } from "react";
import {
  Link as RouterLink,
  Outlet,
  useLocation,
} from "react-router-dom";

import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
// import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import { List, Divider, IconButton, Badge, Container, Tooltip, ListItemIcon, ListItemButton, ListItemText, Typography, Box, Toolbar } from "@mui/material";
import { Link } from '@mui/material';
import { Link as LinkRouter } from 'react-router-dom';

import Brightness4Icon from '@mui/icons-material/Brightness4';

import Apps from "../assets/icons_menu/Apps.svg?react";
import Arbitrables from "../assets/icons_menu/Arbitrables.svg?react";
import Calculator from "../assets/icons_menu/Calculator.svg?react";
import Charts from "../assets/icons_menu/Charts.svg?react";
import Community from "../assets/icons_menu/Community.svg?react";
import Courts from "../assets/icons_menu/Courts.svg?react";
import Dice from "../assets/icons_menu/Dice.svg?react";
import Disputes from "../assets/icons_menu/Disputes.svg?react";
import Graph from "../assets/icons_menu/Graph.svg?react";
import Github from "../assets/icons_menu/Github.svg?react";
import Menu from "../assets/icons_menu/Menu.svg?react";
import PNK from "../assets/icons_menu/PNK.svg?react";
import Stats from "../assets/icons_menu/Stats.svg?react";
import ChevronLeft from "../assets/icons_menu/ChevronLeft.svg?react";
import Klerosboard from "../assets/logos/klerosboard.svg?react";
import Notifications from "../assets/icons/bell_blue_with_dot.svg?react";
import Favorite from "../assets/icons/heart_blue.svg?react";
import Moon from "../assets/icons/moon_blue.svg?react";
import ChainMenu from "./ChainMenu";
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
  width: '64px',
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  flexWrap: 'wrap',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
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
  const [, setMode] = useState('dark');
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  const theme = useTheme();
  const location = useLocation();
  const match = location.pathname.match('(11155111|100|1)(?:/|$)')
  const chainId = match ? match[1] : '1'

  const toggleDrawer = () => {
    setOpen(!open);
  };


  return (
    <>
      <Drawer variant="permanent" open={open}>
        <DrawerHeader sx={{ marginTop: '20px', }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <Klerosboard style={{ width: '48px', }} onClick={toggleDrawer} />
            <Typography variant='h1' color={theme.palette.secondary.main} sx={{ ...(!open && { display: 'none' }), marginLeft: '15px' }}>Klerosboard</Typography>
          </Box>
          <div style={{ width: '100%', minHeight: '30px' }}></div>
          <Menu style={{ ...(open && { display: 'none' }) }} onClick={toggleDrawer} />
          <ChevronLeft style={{ ...(!open && { display: 'none' }) }} onClick={toggleDrawer} />
        </DrawerHeader>

        <Divider sx={{ border: '1px solid #9013FE', marginTop: '20px' }} />
        <List component="nav" sx={{ justifyContent: 'center', marginTop: '20px' }}>
          <Link component={LinkRouter} to={`${chainId}/solutions`} children={
            <ListItemButton>
              <ListItemIcon>
                <Apps />
              </ListItemIcon>
              <ListItemText sx={{ opacity: open ? 1 : 0 }} primary="Solutions" />
            </ListItemButton>
          }
          />

          <Link component={LinkRouter} to={`${chainId}/`} children={
            <ListItemButton>
              <ListItemIcon>
                <Stats />
              </ListItemIcon>
              <ListItemText sx={{ opacity: open ? 1 : 0 }} primary="Dashboard" />
            </ListItemButton>
          }
          />

          <Link component={LinkRouter} to={`${chainId}/odds`} children={
            <ListItemButton>

              <ListItemIcon>
                <Dice />
              </ListItemIcon>
              <ListItemText sx={{ opacity: open ? 1 : 0 }} primary="Juror Odds" />

            </ListItemButton>
          } />

          <Link component={LinkRouter} to={`${chainId}/calculator`} children={
            <ListItemButton>

              <ListItemIcon>
                <Calculator />
              </ListItemIcon>
              <ListItemText sx={{ opacity: open ? 1 : 0 }} primary="Parameters Calculator" />

            </ListItemButton>
          } />

          <Link component={LinkRouter} to={`${chainId}/charts`} children={
            <ListItemButton>

              <ListItemIcon>
                <Charts />
              </ListItemIcon>
              <ListItemText sx={{ opacity: open ? 1 : 0 }} primary="Charts" />

            </ListItemButton>
          } />
          <Link component={LinkRouter} to={`${chainId}/community`} children={
            <ListItemButton>

              <ListItemIcon>
                <Community />
              </ListItemIcon>
              <ListItemText sx={{ opacity: open ? 1 : 0 }} primary="Kleros Family" />

            </ListItemButton>
          } />

          {/* Second Section */}
          <Divider sx={{ my: 1 }} />
          <Link component={LinkRouter} to={`${chainId}/courts`} children={
            <ListItemButton>
              <ListItemIcon>
                <Courts />
              </ListItemIcon>
              <ListItemText sx={{ opacity: open ? 1 : 0 }} primary="Courts" />
            </ListItemButton>
          } />

          <Link component={LinkRouter} to={`${chainId}/cases`} children={
            <ListItemButton>
              <ListItemIcon>
                <Disputes />
              </ListItemIcon>

              <ListItemText sx={{ opacity: open ? 1 : 0 }} primary="Disputes" />

            </ListItemButton>
          } />

          <Link component={LinkRouter} to={`${chainId}/arbitrables`} children={
            <ListItemButton>
              <ListItemIcon>
                <Arbitrables />
              </ListItemIcon>

              <ListItemText sx={{ opacity: open ? 1 : 0 }} primary="Arbitrables" />

            </ListItemButton>
          } />

          <Link component={LinkRouter} to={`${chainId}/stakes`} children={
            <ListItemButton>

              <ListItemIcon>
                <PNK />
              </ListItemIcon>
              <ListItemText sx={{ opacity: open ? 1 : 0 }} primary="Stakes" />

            </ListItemButton>
          } />
        </List>

        <List component="nav" sx={{
          marginTop: 'auto'
        }}>
          <Divider sx={{ my: 1 }} />
          <Link href='https://github.com/klerosboard/' target={'_blank'}>
            <ListItemButton>
              <ListItemIcon sx={{ width: '20px', height: '20px' }}>
                <Github />
              </ListItemIcon>
              <ListItemText sx={{ opacity: open ? 1 : 0 }} primary="Github" />
            </ListItemButton>
          </Link>

          <Link href='https://thegraph.com/explorer/subgraph/klerosboard/klerosboard-mainnet' target={'_blank'}>
            <ListItemButton>
              <ListItemIcon sx={{ width: '20px', height: '20px' }}>
                <Graph />
              </ListItemIcon>
              <ListItemText sx={{ opacity: open ? 1 : 0 }} primary="Graph" />
            </ListItemButton>
          </Link>
        </List>
      </Drawer>


      {/* Content Display */}
      {/* TopNavbar */}
      <Container sx={{ mr: '4%', width: '80%', alignContent: 'center'}}>
        <Container sx={{display: 'inline-block', minHeight: 'calc(100vh - 52px)' }}>
          <Toolbar sx={{ width: '100%' }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}></Typography>
            {/* Chain changer */}
            <ChainMenu chainId={String(chainId) || '1'} />

            {/* Support */}
            <Tooltip title="Support">
              <IconButton color="inherit" size='small' component={RouterLink} to={`${chainId}/support`} children={<Favorite />} />
            </Tooltip>

            {/* Notifications */}
            <IconButton color="inherit">
              <Badge badgeContent={0}>
                <Notifications />
              </Badge>
            </IconButton>

            {/* Theme mode switch */}
            <Tooltip title={theme.palette.mode + " mode"}>
              <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
                {theme.palette.mode === 'light' ? <Moon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
          </Toolbar>

          <div style={{ flexGrow: 1 }}>
            <Outlet />
          </div>
        </Container>

        <Footer />
      </Container>


    </>

  );
};

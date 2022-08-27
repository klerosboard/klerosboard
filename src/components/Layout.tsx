import { useState, useMemo } from "react";
import {
  Link as RouterLink,
  Outlet,
  useSearchParams,
} from "react-router-dom";

import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import { Toolbar, List, Divider, IconButton, Badge, Typography, Container, Tooltip, ListItemIcon, ListItemButton, ListItemText } from "@mui/material";
import { Favorite, ChevronLeft, Notifications } from "@mui/icons-material";
import { Link } from '@mui/material';
import { Link as LinkRouter } from 'react-router-dom';

import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Logo from "../assets/logo.png"

import {ReactComponent as Apps} from "../assets/icons_menu/Apps.svg";
import {ReactComponent as  Arbitrables} from "../assets/icons_menu/Arbitrables.svg";
import {ReactComponent as  Calculator} from "../assets/icons_menu/Calculator.svg";
import {ReactComponent as  Charts} from "../assets/icons_menu/Charts.svg";
import {ReactComponent as  Community} from "../assets/icons_menu/Community.svg";
import {ReactComponent as  Courts} from "../assets/icons_menu/Courts.svg";
import {ReactComponent as  Dice} from "../assets/icons_menu/Dice.svg";
import {ReactComponent as  Disputes} from "../assets/icons_menu/Disputes.svg";
import {ReactComponent as  Graph} from "../assets/icons_menu/Graph.svg";
import {ReactComponent as  Github} from "../assets/icons_menu/Github.svg";
import {ReactComponent as  Menu} from "../assets/icons_menu/Menu.svg";
import {ReactComponent as  PNK} from "../assets/icons_menu/PNK.svg";
import {ReactComponent as  Stats} from "../assets/icons_menu/Stats.svg";


import ChainMenu from "./ChainMenu";
import { getChainId } from "../lib/helpers";

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
            <Menu />
          </IconButton>
        </DrawerHeader>

        <Divider />
        <List component="nav">
          <Link component={LinkRouter} to='/solutions' children={
            <ListItemButton>
              <ListItemIcon>
                <Apps />
              </ListItemIcon>
              <ListItemText primary="Solutions" />
            </ListItemButton>
          }
          />

          <Link component={LinkRouter} to='/' children={
            <ListItemButton>
              <ListItemIcon>
                <Stats />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          }
          />

          <Link component={LinkRouter} to='/odds' children={
            <ListItemButton>

              <ListItemIcon>
                <Dice />
              </ListItemIcon>
              <ListItemText primary="Juror Odds" />

            </ListItemButton>
          } />

          <Link component={LinkRouter} to='/calculator' children={
            <ListItemButton>

              <ListItemIcon>
                <Calculator />
              </ListItemIcon>
              <ListItemText primary="Parameters Calculator" />

            </ListItemButton>
          } />

          <Link component={LinkRouter} to='/charts' children={
            <ListItemButton>

              <ListItemIcon>
                <Charts />
              </ListItemIcon>
              <ListItemText primary="Cgarts" />

            </ListItemButton>
          } />
          <Link component={LinkRouter} to='/community' children={
            <ListItemButton>

              <ListItemIcon>
                <Community />
              </ListItemIcon>
              <ListItemText primary="Kleros Family" />

            </ListItemButton>
          } />

          {/* Second Section */}
          <Divider sx={{ my: 1, background: '#4D00B4' }} />
          <Link component={LinkRouter} to='/courts' children={
            <ListItemButton>
              <ListItemIcon>
                <Courts />
              </ListItemIcon>
              <ListItemText primary="Courts" />
            </ListItemButton>
          } />

          <Link component={LinkRouter} to='/cases' children={
            <ListItemButton>
              <ListItemIcon>
                <Disputes />
              </ListItemIcon>

              <ListItemText primary="Disputes" />

            </ListItemButton>
          } />

          <Link component={LinkRouter} to='/arbitrables' children={
            <ListItemButton>
              <ListItemIcon>
                <Arbitrables />
              </ListItemIcon>

              <ListItemText primary="Arbitrables" />

            </ListItemButton>
          } />

          <Link component={LinkRouter} to='/stakes' children={
            <ListItemButton>

              <ListItemIcon>
                <PNK />
              </ListItemIcon>
              <ListItemText primary="Stakes" />

            </ListItemButton>
          } />
        </List>

        <List component="nav" sx={{
          marginTop: 'auto'
        }}>
          <Divider sx={{ my: 1, background: '#4D00B4' }} />
          <Link href='https://github.com/salgozino/KlerosJurorDashboard' target={'_blank'}>
            <ListItemButton>
              <ListItemIcon sx={{ width: '20px', height: '20px' }}>
                <Github />
              </ListItemIcon>
              <ListItemText primary="Github" />
            </ListItemButton>
          </Link>

          <Link href='https://thegraph.com/explorer/subgraph/salgozino/klerosboard' target={'_blank'}>
            <ListItemButton>
              <ListItemIcon sx={{ width: '20px', height: '20px' }}>
                <Graph />
              </ListItemIcon>
              <ListItemText primary="Graph" />
            </ListItemButton>
          </Link>
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

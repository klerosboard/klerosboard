import { useState, useMemo } from "react";
import {
  Link as RouterLink,
  Outlet,
  useSearchParams,
} from "react-router-dom";

import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
// import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import { List, Divider, IconButton, Badge, Container, Tooltip, ListItemIcon, ListItemButton, ListItemText, Typography, Box, Toolbar } from "@mui/material";
import { Link } from '@mui/material';
import { Link as LinkRouter } from 'react-router-dom';

import Brightness4Icon from '@mui/icons-material/Brightness4';

import { ReactComponent as Apps } from "../assets/icons_menu/Apps.svg";
import { ReactComponent as Arbitrables } from "../assets/icons_menu/Arbitrables.svg";
import { ReactComponent as Calculator } from "../assets/icons_menu/Calculator.svg";
import { ReactComponent as Charts } from "../assets/icons_menu/Charts.svg";
import { ReactComponent as Community } from "../assets/icons_menu/Community.svg";
import { ReactComponent as Courts } from "../assets/icons_menu/Courts.svg";
import { ReactComponent as Dice } from "../assets/icons_menu/Dice.svg";
import { ReactComponent as Disputes } from "../assets/icons_menu/Disputes.svg";
import { ReactComponent as Graph } from "../assets/icons_menu/Graph.svg";
import { ReactComponent as Github } from "../assets/icons_menu/Github.svg";
import { ReactComponent as Menu } from "../assets/icons_menu/Menu.svg";
import { ReactComponent as PNK } from "../assets/icons_menu/PNK.svg";
import { ReactComponent as Stats } from "../assets/icons_menu/Stats.svg";
import { ReactComponent as ChevronLeft } from "../assets/icons_menu/ChevronLeft.svg";
import { ReactComponent as Klerosboard } from "../assets/logos/klerosboard.svg";
import { ReactComponent as Notifications } from "../assets/icons/bell_blue_with_dot.svg";
import { ReactComponent as Favorite } from "../assets/icons/heart_blue.svg";
import { ReactComponent as Moon } from "../assets/icons/moon_blue.svg";


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

// interface AppBarProps extends MuiAppBarProps {
//   open?: boolean;
// }

// const AppBar = styled(MuiAppBar, {
//   shouldForwardProp: (prop) => prop !== 'open',
// })<AppBarProps>(({ theme, open }) => ({
//   zIndex: theme.zIndex.drawer + 1,
//   transition: theme.transitions.create(['width', 'margin'], {
//     easing: theme.transitions.easing.sharp,
//     duration: theme.transitions.duration.leavingScreen,
//   }),
//   ...(open && {
//     marginLeft: drawerWidth,
//     width: `calc(100% - ${drawerWidth}px)`,
//     transition: theme.transitions.create(['width', 'margin'], {
//       easing: theme.transitions.easing.sharp,
//       duration: theme.transitions.duration.enteringScreen,
//     }),
//   }),
// }));

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
              <ListItemText primary="Charts" />

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
          <Divider sx={{ my: 1}} />
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
          <Divider sx={{ my: 1}} />
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
      {/* TopNavbar */}
      <Container sx={{ mr: '24px' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}></Typography>
          {/* Chain changer */}
          <ChainMenu chainId={chainId} />

          {/* Support */}
          <Tooltip title="Support">
            <IconButton color="inherit" size='small' component={RouterLink} to="/support" children={<Favorite />} />
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


        <Outlet />
        <Footer />
      </Container>

    </>

  );
};

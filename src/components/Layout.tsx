import { forwardRef, useState } from 'react';
import { Link as RouterLink, Outlet } from 'react-router-dom';

import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
// import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import {
  List,
  Divider,
  IconButton,
  Badge,
  Container,
  Tooltip,
  ListItemIcon,
  ListItemButton,
  ListItemButtonProps,
  ListItemText,
  Typography,
  Box,
  Toolbar,
  useMediaQuery,
} from '@mui/material';
import { Link } from '@mui/material';
import { Link as LinkRouter } from 'react-router-dom';

import Brightness4Icon from '@mui/icons-material/Brightness4';
import { useThemeMode } from '../lib/ThemeModeContext';

import Apps from '../assets/icons_menu/Apps.svg?react';
import Arbitrables from '../assets/icons_menu/Arbitrables.svg?react';
import Charts from '../assets/icons_menu/Charts.svg?react';
import Courts from '../assets/icons_menu/Courts.svg?react';
import Dice from '../assets/icons_menu/Dice.svg?react';
import Disputes from '../assets/icons_menu/Disputes.svg?react';
import Graph from '../assets/icons_menu/Graph.svg?react';
import Github from '../assets/icons_menu/Github.svg?react';
import Menu from '../assets/icons_menu/Menu.svg?react';
import PNK from '../assets/icons_menu/PNK.svg?react';
import Stats from '../assets/icons_menu/Stats.svg?react';
import ChevronLeft from '../assets/icons_menu/ChevronLeft.svg?react';
import Klerosboard from '../assets/logos/klerosboard.svg?react';
import Notifications from '../assets/icons/bell_blue_with_dot.svg?react';
import Favorite from '../assets/icons/heart_blue.svg?react';
import Moon from '../assets/icons/moon_blue.svg?react';
import ChainMenu from './ChainMenu';
import Footer from './Footer';
import { useChainId } from '../hooks/useChainId';

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

interface MenuItemButtonProps extends ListItemButtonProps {
  closeDrawer?: () => void;
}

const MenuItemButton = forwardRef<HTMLDivElement, MenuItemButtonProps>(function MenuItemButton(
  { closeDrawer, ...props },
  ref,
) {
  return (
    <ListItemButton
      ref={ref}
      {...props}
      onClick={(event) => {
        closeDrawer?.();
        props.onClick?.(event);
      }}
    />
  );
});

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'isSmallScreen' })(
  ({ theme, open, isSmallScreen }) => ({
    width: isSmallScreen ? undefined : drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(isSmallScreen
      ? {
          '& .MuiDrawer-paper': openedMixin(theme),
        }
      : {
          ...(open && {
            ...openedMixin(theme),
            '& .MuiDrawer-paper': openedMixin(theme),
          }),
          ...(!open && {
            ...closedMixin(theme),
            '& .MuiDrawer-paper': closedMixin(theme),
          }),
        }),
  }),
);

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { mode, toggle } = useThemeMode();

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const chainId = useChainId();

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const closeDrawer = () => {
    if (isSmallScreen) setOpen(false);
  };

  return (
    <>
      <Drawer
        variant={isSmallScreen ? 'temporary' : 'permanent'}
        open={open}
        isSmallScreen={isSmallScreen}
        onClose={isSmallScreen ? () => setOpen(false) : undefined}
      >
        <DrawerHeader sx={{ marginTop: '20px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <Klerosboard style={{ width: '48px' }} onClick={toggleDrawer} />
            <Typography
              variant="body1"
              color={theme.palette.secondary.main}
              sx={{
                ...(!open && { display: 'none' }),
                marginLeft: '15px',
                fontFamily: 'Open Sans',
                fontSize: '16px',
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: 0,
              }}
            >
              Klerosboard
            </Typography>
          </Box>
          <div style={{ width: '100%', minHeight: '30px' }}></div>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Menu style={{ ...(open && { display: 'none' }) }} onClick={toggleDrawer} />
            <ChevronLeft style={{ ...(!open && { display: 'none' }) }} onClick={toggleDrawer} />
          </Box>
        </DrawerHeader>

        <Divider sx={{ border: '1px solid', borderColor: 'violet.dark', marginTop: '20px' }} />
        <List
          component="nav"
          sx={{
            justifyContent: 'center',
            marginTop: '20px',
            '& .MuiListItemButton-root': {
              justifyContent: open ? 'flex-start' : 'center',
              paddingLeft: open ? 2 : 0,
              paddingRight: open ? 2 : 0,
            },
            '& .MuiListItemIcon-root': {
              minWidth: 0,
              justifyContent: 'center',
              marginRight: open ? 2 : 0,
            },
          }}
        >
          <Link
            component={LinkRouter}
            to={`${chainId}/solutions`}
            children={
              <MenuItemButton closeDrawer={closeDrawer}>
                <ListItemIcon>
                  <Apps />
                </ListItemIcon>
                <ListItemText sx={{ display: open ? 'block' : 'none' }} primary="Solutions" />
              </MenuItemButton>
            }
          />

          <Link
            component={LinkRouter}
            to={`${chainId}/`}
            children={
              <MenuItemButton closeDrawer={closeDrawer}>
                <ListItemIcon>
                  <Stats />
                </ListItemIcon>
                <ListItemText sx={{ display: open ? 'block' : 'none' }} primary="Dashboard" />
              </MenuItemButton>
            }
          />

          <Link
            component={LinkRouter}
            to={`${chainId}/odds`}
            children={
              <MenuItemButton closeDrawer={closeDrawer}>
                <ListItemIcon>
                  <Dice />
                </ListItemIcon>
                <ListItemText sx={{ display: open ? 'block' : 'none' }} primary="Juror Odds" />
              </MenuItemButton>
            }
          />

          <Link
            component={LinkRouter}
            to={`${chainId}/charts`}
            children={
              <MenuItemButton closeDrawer={closeDrawer}>
                <ListItemIcon>
                  <Charts />
                </ListItemIcon>
                <ListItemText sx={{ display: open ? 'block' : 'none' }} primary="Charts" />
              </MenuItemButton>
            }
          />
          {/* Second Section */}
          <Divider sx={{ my: 1, border: '1px solid', borderColor: 'violet.dark' }} />
          <Link
            component={LinkRouter}
            to={`${chainId}/courts`}
            children={
              <MenuItemButton closeDrawer={closeDrawer}>
                <ListItemIcon>
                  <Courts />
                </ListItemIcon>
                <ListItemText sx={{ display: open ? 'block' : 'none' }} primary="Courts" />
              </MenuItemButton>
            }
          />

          <Link
            component={LinkRouter}
            to={`${chainId}/cases`}
            children={
              <MenuItemButton closeDrawer={closeDrawer}>
                <ListItemIcon>
                  <Disputes />
                </ListItemIcon>

                <ListItemText sx={{ display: open ? 'block' : 'none' }} primary="Disputes" />
              </MenuItemButton>
            }
          />

          <Link
            component={LinkRouter}
            to={`${chainId}/arbitrables`}
            children={
              <MenuItemButton closeDrawer={closeDrawer}>
                <ListItemIcon>
                  <Arbitrables />
                </ListItemIcon>

                <ListItemText sx={{ display: open ? 'block' : 'none' }} primary="Arbitrables" />
              </MenuItemButton>
            }
          />

          <Link
            component={LinkRouter}
            to={`${chainId}/stakes`}
            children={
              <MenuItemButton closeDrawer={closeDrawer}>
                <ListItemIcon>
                  <PNK />
                </ListItemIcon>
                <ListItemText sx={{ display: open ? 'block' : 'none' }} primary="Stakes" />
              </MenuItemButton>
            }
          />
        </List>

        <List
          component="nav"
          sx={{
            marginTop: 'auto',
            '& .MuiListItemButton-root': {
              justifyContent: open ? 'flex-start' : 'center',
              paddingLeft: open ? 2 : 0,
              paddingRight: open ? 2 : 0,
            },
            '& .MuiListItemIcon-root': {
              minWidth: 0,
              justifyContent: 'center',
              marginRight: open ? 2 : 0,
            },
          }}
        >
          <Divider sx={{ my: 1, border: '1px solid', borderColor: 'violet.dark' }} />
          <Link href="https://github.com/klerosboard/" target={'_blank'}>
            <MenuItemButton closeDrawer={closeDrawer}>
              <ListItemIcon sx={{ width: '20px', height: '20px' }}>
                <Github />
              </ListItemIcon>
              <ListItemText sx={{ display: open ? 'block' : 'none' }} primary="Github" />
            </MenuItemButton>
          </Link>

          <Link href="https://thegraph.com/explorer/subgraph/klerosboard/klerosboard-mainnet" target={'_blank'}>
            <MenuItemButton closeDrawer={closeDrawer}>
              <ListItemIcon sx={{ width: '20px', height: '20px' }}>
                <Graph />
              </ListItemIcon>
              <ListItemText sx={{ display: open ? 'block' : 'none' }} primary="Graph" />
            </MenuItemButton>
          </Link>
        </List>
      </Drawer>

      {/* Content Display */}
      {/* TopNavbar */}
      <Container sx={{ mr: isSmallScreen ? 0 : '4%', width: isSmallScreen ? '100%' : '80%', alignContent: 'center' }}>
        <Container
          sx={{
            display: isSmallScreen ? 'block' : 'inline-block',
            width: isSmallScreen ? '100%' : undefined,
            minHeight: 'calc(100vh - 52px)',
          }}
        >
          <Toolbar sx={{ width: '100%' }}>
            {isSmallScreen && (
              <IconButton
                onClick={toggleDrawer}
                sx={{
                  mr: 1,
                  backgroundColor: 'violet.main',
                  color: 'violet.contrastText',
                  '&:hover': { backgroundColor: 'violet.dark' },
                }}
              >
                <Menu />
              </IconButton>
            )}
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}></Typography>
            {/* Chain changer */}
            <ChainMenu chainId={String(chainId) || '1'} />

            {/* Support */}
            <Tooltip title="Support">
              <IconButton
                color="inherit"
                size="small"
                component={RouterLink}
                to={`${chainId}/support`}
                children={<Favorite />}
              />
            </Tooltip>

            {/* Notifications */}
            <IconButton color="inherit">
              <Badge badgeContent={0}>
                <Notifications />
              </Badge>
            </IconButton>

            {/* Theme mode switch */}
            <Tooltip title={mode + ' mode'}>
              <IconButton sx={{ ml: 1 }} onClick={toggle} color="inherit">
                {mode === 'light' ? <Moon /> : <Brightness4Icon />}
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
}

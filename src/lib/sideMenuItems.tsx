
import { Avatar, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Link } from '@mui/material';
import { Feed, Casino, Dashboard, People, Gavel, Balance, Paid } from '@mui/icons-material';
import { Link as LinkRouter } from 'react-router-dom';
import { Fragment } from 'react';
import graphImg from '../assets/graphprotocol.png';
import githubImg from '../assets/github.png';

export const mainListItems = (
  <Fragment>
    <Link component={LinkRouter} to='/' children={
      <ListItemButton>
        <ListItemIcon>
          <Dashboard color="secondary"/>
        </ListItemIcon>
        <ListItemText primary="Dashboard" />
      </ListItemButton>
    }
    />

    <Link component={LinkRouter} to='/odds' children={
      <ListItemButton>

        <ListItemIcon>
          <Casino color="secondary"/>
        </ListItemIcon>
        <ListItemText primary="Odds" />

      </ListItemButton>
    } />

    <Link component={LinkRouter} to='/community' children={
      <ListItemButton>

        <ListItemIcon>
          <People color="secondary"/>
        </ListItemIcon>
        <ListItemText primary="Kleros Family" />

      </ListItemButton>
    } />

  </Fragment>
);

export const secondaryListItems = (
  <Fragment>
    {/* <ListSubheader component="div" inset>
      Kleros Explorer
    </ListSubheader> */}

    <Link component={LinkRouter} to='/courts' children={
      <ListItemButton>
        <ListItemIcon>
          <Balance color="secondary"/>
        </ListItemIcon>
        <ListItemText primary="Courts" />
      </ListItemButton>
    } />

    <Link component={LinkRouter} to='/cases' children={
      <ListItemButton>
        <ListItemIcon>
          <Gavel color="secondary"/>
        </ListItemIcon>

        <ListItemText primary="Disputes" />

      </ListItemButton>
    } />

    <Link component={LinkRouter} to='/arbitrables' children={
      <ListItemButton>
        <ListItemIcon>
          <Feed color="secondary"/>
        </ListItemIcon>

        <ListItemText primary="Arbitrables" />

      </ListItemButton>
    } />

    <Link component={LinkRouter} to='/stakes' children={
      <ListItemButton>

        <ListItemIcon>
          <Paid color="secondary"/>
        </ListItemIcon>
        <ListItemText primary="Stakes" />

      </ListItemButton>
    } />
  </Fragment>
);

export const footerListItems = (
  <Fragment>
    {/* <ListSubheader component="div" inset>
      Repositories
    </ListSubheader> */}

    <Link href='https://github.com/salgozino/KlerosJurorDashboard' target={'_blank'}>
      <ListItemButton>
        <ListItemIcon>
          <Avatar src={githubImg} alt='Github' sx={{width: '20px', height: '20px'}}/>
        </ListItemIcon>
        <ListItemText primary="Github" />
      </ListItemButton>
    </Link>

      <Link href='https://thegraph.com/explorer/subgraph/salgozino/klerosboard' target={'_blank'}>
        <ListItemButton>
          <ListItemIcon>
            <Avatar src={graphImg} alt='The Graph' sx={{width: '20px', height: '20px'}}/>
          </ListItemIcon>
          <ListItemText primary="Graph" />
        </ListItemButton>
      </Link>
  </Fragment>
);

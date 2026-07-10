/* eslint-disable react-refresh/only-export-components */
import './index.css';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, useRoutes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <h1 style={{ fontSize: '32px', margin: '0 0 16px', color: '#4D00B4' }}>Something went wrong</h1>
          <p style={{ fontSize: '16px', color: '#666', margin: '0 0 24px' }}>An unexpected error occurred.</p>
          <a href="/" style={{ color: '#009AFF', fontWeight: 600 }}>
            Go to Dashboard
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}

import { I18nProvider } from './lib/I18nProvider';
import { ReactQueryProvider } from './lib/react-query';
import { darkTheme, lightTheme } from './lib/theme';
import { ThemeModeProvider, useThemeMode } from './lib/ThemeModeContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Courts from './pages/Courts';
import Court from './pages/Court';
import Disputes from './pages/Disputes';
import Dispute from './pages/Dispute';
import Arbitrables from './pages/Arbitrables';
import Arbitrable from './pages/Arbitrable';
import Odds from './pages/Odds';
import Support from './pages/Support';
import Stakes from './pages/Stakes';
import Solutions from './pages/Solutions';
import Charts from './pages/Charts';
import Calculator from './pages/Calculator';
import Community from './pages/Community';
import RedirectDispute from './pages/RedirectDispute';
import AggregatedCharts from './pages/AggregatedCharts';

function buildChainRoutes(chainId: string) {
  return [
    { path: `/${chainId}/`, element: <Home /> },
    { path: `/${chainId}/odds`, element: <Odds /> },
    { path: `/${chainId}/community`, element: <Community /> },
    { path: `/${chainId}/support`, element: <Support /> },
    { path: `/${chainId}/stakes`, element: <Stakes /> },
    { path: `/${chainId}/calculator`, element: <Calculator /> },
    { path: `/${chainId}/solutions`, element: <Solutions /> },
    { path: `/${chainId}/charts`, element: <Charts /> },
    {
      path: `/${chainId}/courts`,
      children: [
        { index: true, element: <Courts /> },
        { path: ':id', element: <Court /> },
      ],
    },
    {
      path: `/${chainId}/cases`,
      children: [
        { index: true, element: <Disputes /> },
        { path: ':id', element: <Dispute /> },
      ],
    },
    {
      path: `/${chainId}/arbitrables`,
      children: [
        { index: true, element: <Arbitrables /> },
        { path: ':id', element: <Arbitrable /> },
      ],
    },
    {
      path: `/${chainId}/profile`,
      children: [
        { index: true, element: <Profile /> },
        { path: ':id', element: <Profile /> },
      ],
    },
  ];
}

function App() {
  const validChainIds = ['1', '100', '42161'];
  const routes = [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Navigate to="/1" replace /> },
        { path: '/aggregated-charts', element: <AggregatedCharts /> },
        ...validChainIds.flatMap(buildChainRoutes),
        // Sepolia: ruta no publicada, solo para uso interno/testnet
        ...buildChainRoutes('11155111'),
        {
          path: '*',
          element: (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <h1 style={{ fontSize: '48px', margin: '0 0 16px', color: '#4D00B4' }}>404</h1>
              <p style={{ fontSize: '18px', color: '#666', margin: '0 0 24px' }}>Page not found</p>
              <a href="/" style={{ color: '#009AFF', fontWeight: 600 }}>
                Go to Dashboard
              </a>
            </div>
          ),
        },
      ],
    },
    {
      path: '/dispute',
      element: <RedirectDispute />,
    },
  ];
  return useRoutes(routes);
}

function ThemedApp() {
  const { mode } = useThemeMode();
  const theme = mode === 'dark' ? darkTheme : lightTheme;
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <I18nProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ReactQueryProvider>
        <ThemeModeProvider>
          <ThemedApp />
        </ThemeModeProvider>
      </ReactQueryProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

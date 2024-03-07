import "./index.css";

import React from "react";
import ReactDOM from "react-dom";
import {
  BrowserRouter,
  useRoutes,
} from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";

import { I18nProvider } from "./lib/I18nProvider";
import { ReactQueryProvider } from "./lib/react-query";
import theme from "./lib/theme"
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Courts from "./pages/Courts";
import Court from "./pages/Court";
import Disputes from "./pages/Disputes";
import Dispute from "./pages/Dispute";
import Arbitrables from "./pages/Arbitrables";
import Arbitrable from "./pages/Arbitrable";
import Odds from "./pages/Odds";
import Support from "./pages/Support";
import Stakes from "./pages/Stakes";
import Solutions from "./pages/Solutions";
import Charts from "./pages/Charts";
import Calculator from "./pages/Calculator";
import Community from "./pages/Community";
import RedirectDispute from "./pages/RedirectDispute";

function App() {
  const validChainIds = ['1', '100'];
  const routes = [
    {
      path: '/',
      element: <Layout />,
      children: [
        ...validChainIds.flatMap((chainId: string) => {
          return [
            { path: `/${chainId}/`, element: <Home />},
            { path: `/${chainId}/odds`, element: <Odds />},
            { path: `/${chainId}/community`, element: <Community />},
            { path: `/${chainId}/support`, element: <Support /> },
            { path: `/${chainId}/stakes`, element: <Stakes /> },
            { path: `/${chainId}/calculator`, element: <Calculator /> },
            { path: `/${chainId}/solutions`, element: <Solutions /> },
            { path: `/${chainId}/charts`, element: <Charts /> },
            { path: `/${chainId}/courts`, children: [
                { index: true, element: <Courts /> },
                { path: ':id', element: <Court /> }
              ]
            },
            {path: `/${chainId}/cases`, children: [
                { index: true, element: <Disputes /> },
                { path: ':id', element: <Dispute /> }
              ]
            },
            {path: `/${chainId}/arbitrables`, children: [
                { index: true, element: <Arbitrables /> },
                { path: ':id', element: <Arbitrable /> }
              ]
            },
            {path: `/${chainId}/profile`, children: [
                { index: true, element: <Profile /> },
                { path: ':id', element: <Profile /> }
              ]
            },
          ]
        }
        )
      ]
    },
    {
      path: "/dispute", element: <RedirectDispute />
    },
    {
      path: "*",
      element: <div>Not Found</div>,
    },
  ];
  console.log(routes)
  return useRoutes(routes);
}

ReactDOM.render(
  <React.StrictMode>
    <ReactQueryProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <I18nProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </I18nProvider>
      </ThemeProvider>
    </ReactQueryProvider>
  </React.StrictMode>,
  document.getElementById("root"),
);

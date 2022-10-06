import "./index.css";

import { DAppProvider, Mainnet, Localhost } from "@usedapp/core";
import React from "react";
import ReactDOM from "react-dom";
import {
  HashRouter,
  Routes,
  Route,
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


const config = {
  readOnlyChainId: Mainnet.chainId,
  networks: [Mainnet, Localhost],
  noMetamaskDeactivate: false,
}

ReactDOM.render(
  <React.StrictMode>
    <DAppProvider config={config}>
      <ReactQueryProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <I18nProvider>
              <HashRouter>
                <Routes>
                  <Route element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="odds" element={<Odds />}/>
                    <Route path="community" element={<Community />} />
                    <Route path="support" element={<Support />}/>
                    <Route path="stakes" element={<Stakes />}/>
                    <Route path="calculator" element={<Calculator />}/>
                    <Route path="solutions" element={<Solutions />}/>
                    <Route path="charts" element={<Charts />}/>
                    <Route path="courts">
                      <Route index element={<Courts />} />
                      <Route path=":id" element={<Court />} />
                    </Route>
                    <Route path="cases" >
                      <Route index element={<Disputes />} />
                      <Route path=":id" element={<Dispute />} />
                    </Route>
                    <Route path="arbitrables" >
                      <Route index element={<Arbitrables />} />
                      <Route path=":id" element={<Arbitrable />} />
                    </Route>
                    <Route path="profile">
                      <Route index element={<Profile />} />
                      <Route path=":id" element={<Profile />} />
                    </Route>
                  </Route>
                </Routes>
              </HashRouter>
          </I18nProvider>
        </ThemeProvider>
      </ReactQueryProvider>
    </DAppProvider>
  </React.StrictMode>,
  document.getElementById("root"),
);

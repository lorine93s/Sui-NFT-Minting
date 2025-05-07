import { BrowserRouter as Router, Routes, Route } from "react-router";
// import SignIn from "./pages/AuthPages/SignIn";
// import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
// import UserProfiles from "./pages/UserProfiles";
// import Videos from "./pages/UiElements/Videos";
// import Images from "./pages/UiElements/Images";
// import Alerts from "./pages/UiElements/Alerts";
// import Badges from "./pages/UiElements/Badges";
// import Avatars from "./pages/UiElements/Avatars";
// import Buttons from "./pages/UiElements/Buttons";
// import LineChart from "./pages/Charts/LineChart";
// import BarChart from "./pages/Charts/BarChart";
// import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import NFTDashbord from "./pages/Dashboard/NFTs";
// import FormElements from "./pages/Forms/FormElements";
// import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getFullnodeUrl } from "@mysten/sui/client";
import "@mysten/dapp-kit/dist/index.css";

const queryClient = new QueryClient();
const { networkConfig } = createNetworkConfig({
  devnet: {
    url: getFullnodeUrl("devnet"),
  },
  testnet: {
    url: getFullnodeUrl("testnet"),
  },
  mainnet: {
    url: getFullnodeUrl("mainnet"),
  },
});


export default function App() {
  return (
    <>
    <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="devnet">
          <WalletProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />

            <Route path="/basic-tables" element={<BasicTables />} />
            <Route path="/nft-dashboard" element={<NFTDashbord />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </>
  );
}

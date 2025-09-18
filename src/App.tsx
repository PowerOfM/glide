import { PeerPage } from "./pages/peer"
import { SignalPage } from "./pages/signal"
import { Switch, Route, Redirect } from "wouter"
import { DiscoverPage } from "./pages/discover"
import { PairRequestPage } from "./pages/pairRequest"
import { PairResponsePage } from "./pages/pairResponse"

export const App = () => (
  <Switch>
    <Route path="/peer" component={PeerPage} />
    <Route path="/signal" component={SignalPage} />
    <Route path="/pair-response" component={PairResponsePage} />
    <Route path="/pair-request" component={PairRequestPage} />
    <Route path="/discover" component={DiscoverPage} />
    <Redirect to="/discover" />
  </Switch>
)

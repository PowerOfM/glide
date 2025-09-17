import { PeerPage } from "./pages/peer"
import { SignalPage } from "./pages/signal"
import { Switch, Route, Redirect } from "wouter"
import { DiscoverPage } from "./pages/discover"
import { PairPage } from "./pages/pair"

export const App = () => (
  <Switch>
    <Route path="/peer" component={PeerPage} />
    <Route path="/signal" component={SignalPage} />
    <Route path="/pair" component={PairPage} />
    <Route path="/discover" component={DiscoverPage} />
    <Redirect to="/discover" />
  </Switch>
)

import { PeeringPage } from "./peering/PeeringPage"
import { SignalingPage } from "./signaling/SignalingPage"
import { Switch, Route, Redirect } from "wouter"
import { DiscoveryPage } from "./pages/discovery"

export const App = () => (
  <Switch>
    <Route path="/secure" component={PeeringPage} />
    <Route path="/signal" component={SignalingPage} />
    <Route path="/pair" component={PairingPage} />
    <Route path="/discover" component={DiscoveryPage} />
    <Redirect to="/discover" />
  </Switch>
)

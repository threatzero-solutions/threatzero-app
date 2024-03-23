import "./App.css";
import { Outlet } from "react-router-dom";
import SplashScreen from "./components/layouts/SplashScreen";
import { useContext } from "react";
import { CoreContext } from "./contexts/core/core-context";

function App() {
  const { interceptorReady } = useContext(CoreContext);
  return <>{interceptorReady ? <Outlet /> : <SplashScreen />}</>;
}

export default App;

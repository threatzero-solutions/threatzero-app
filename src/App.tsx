import './App.css';
import { Outlet } from 'react-router-dom';
import SplashScreen from './components/layouts/SplashScreen';
import { useContext } from 'react';
import { SurveysContext } from './contexts/surveys/surveys-context';

function App() {
  const { loadingFinished: startSurveyLoadingFinished } =
    useContext(SurveysContext);
  return <>{startSurveyLoadingFinished ? <Outlet /> : <SplashScreen />}</>;
}

export default App;

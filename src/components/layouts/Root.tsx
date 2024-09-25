import { Outlet } from "react-router-dom";
import AuthProvider from "../../contexts/AuthProvider";
import { RootContexts } from "../../contexts/RootContexts";
import { useTitles } from "../../hooks/use-titles";

const Root: React.FC = () => {
  useTitles();

  return (
    <AuthProvider>
      <RootContexts>
        <Outlet />
      </RootContexts>
    </AuthProvider>
  );
};

export default Root;

import { Outlet } from "react-router";
import AuthProvider from "../../contexts/auth/AuthProvider";
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

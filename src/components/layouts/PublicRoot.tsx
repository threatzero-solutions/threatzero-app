import { Outlet } from "react-router-dom";
import { AlertContextProvider } from "../../contexts/alert/alert-context";
import { FormsContextProvider } from "../../contexts/forms/forms-context";
import QueryContext from "../../contexts/QueryContext";
import { useTitles } from "../../hooks/use-titles";
import PublicLayout from "./PublicLayout";

const PublicRoot: React.FC = () => {
  useTitles();

  return (
    <AlertContextProvider>
      <QueryContext>
        <FormsContextProvider>
          <PublicLayout>
            <Outlet />
          </PublicLayout>
        </FormsContextProvider>
      </QueryContext>
    </AlertContextProvider>
  );
};

export default PublicRoot;

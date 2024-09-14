import { Outlet } from "react-router-dom";
import { ErrorContextProvider } from "../../contexts/error/error-context";
import { FormsContextProvider } from "../../contexts/forms/forms-context";
import QueryContext from "../../contexts/QueryContext";
import { useTitles } from "../../hooks/use-titles";
import PublicLayout from "./PublicLayout";

const PublicRoot: React.FC = () => {
  useTitles();

  return (
    <ErrorContextProvider>
      <QueryContext>
        <FormsContextProvider>
          <PublicLayout>
            <Outlet />
          </PublicLayout>
        </FormsContextProvider>
      </QueryContext>
    </ErrorContextProvider>
  );
};

export default PublicRoot;

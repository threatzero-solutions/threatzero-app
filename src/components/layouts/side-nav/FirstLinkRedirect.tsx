import { useContext, useEffect } from "react";
import { CoreContext } from "../../../contexts/core/core-context";
import { useNavigate } from "react-router-dom";

const FirstLinkRedirect: React.FC = () => {
  const { state } = useContext(CoreContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (state.mainNavigationItems.length) {
      navigate(
        state.mainNavigationItems.filter((item) => {
          // Skip administrative reports.
          if (item.href === "/administrative-reports") {
            return false;
          }

          // Skip threat assessments.
          if (item.href === "/threat-assessments") {
            return false;
          }

          return true;
        })[0]?.href
      );
    }
  }, [navigate, state.mainNavigationItems]);

  return <></>;
};

export default FirstLinkRedirect;

import { useContext, useEffect } from "react";
import { CoreContext } from "../../../contexts/core/core-context";
import { useNavigate } from "react-router";

const FirstLinkRedirect: React.FC = () => {
  const { state } = useContext(CoreContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (state.mainNavigationItems.length) {
      navigate(state.mainNavigationItems[0]?.to ?? "/");
    }
  }, [navigate, state.mainNavigationItems]);

  return <></>;
};

export default FirstLinkRedirect;

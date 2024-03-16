import { useContext, useEffect } from 'react';
import { CoreContext } from '../../../contexts/core/core-context';
import { useNavigate } from 'react-router-dom';

const FirstLinkRedirect: React.FC = () => {
  const { state } = useContext(CoreContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (state.mainNavigationItems.length) {
      navigate(state.mainNavigationItems[0].href);
    }
  }, [navigate, state.mainNavigationItems]);

  return <></>;
};

export default FirstLinkRedirect;

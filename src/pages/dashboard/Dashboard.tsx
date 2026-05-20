import { Outlet } from "react-router";
import Shell from "../../components/chrome/Shell";

const Dashboard: React.FC = () => {
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
};

export default Dashboard;

import { Outlet } from "react-router-dom";
import SideNav from "../../components/layouts/side-nav/SideNav";
import Footer from "../../components/layouts/Footer";

const Dashboard: React.FC = () => {
  return (
    <div className="flex relative h-full">
      <div className="lg:w-72 shrink-0"></div>
      <div className="flex flex-col flex-1 w-full">
        <SideNav />
        <div className="flex flex-col w-full grow">
          <div className="max-w-5xl w-full mx-auto lg:px-12 md:px-8 px-4 grow pb-20">
            <Outlet />
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

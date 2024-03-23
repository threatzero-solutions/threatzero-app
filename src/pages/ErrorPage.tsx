import { Link } from "react-router-dom";
import Footer from "../components/layouts/Footer";
import { useAuth } from "../contexts/AuthProvider";

const HOME_PAGE = "/";

interface ErrorPageProps {
  friendlyErrorMessage?: string;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ friendlyErrorMessage }) => {
  const { keycloak } = useAuth();

  return (
    <div className="min-h-full flex flex-col">
      <div className="md:flex md:items-center md:justify-between py-2 px-6 bg-white">
        <div className="grow"></div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            type="button"
            onClick={() => keycloak?.logout()}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </div>
      <main className="grid grow place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
        <div className="text-center">
          <p className="text-base font-semibold text-primary-600">Error</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Oops
          </h1>
          <p className="mt-6 text-base leading-7 text-gray-600">
            {friendlyErrorMessage ?? "Something went wrong."}
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href={HOME_PAGE}
              className="rounded-md bg-primary-400 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
            >
              Go back home
            </a>
            <Link
              to={"/support"}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-gray-900"
            >
              Contact support <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ErrorPage;

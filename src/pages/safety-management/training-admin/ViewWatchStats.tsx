import { FormEvent, useContext, useMemo, useState } from "react";
import UnitSelect from "../../../components/forms/inputs/UnitSelect";
import { SimpleChangeEvent } from "../../../types/core";
import { Organization, Unit } from "../../../types/entities";
import { getWatchStats } from "../../../queries/training-admin";
import { TrainingContext } from "../../../contexts/training/training-context";
import { useAuth } from "../../../contexts/AuthProvider";
import { LEVEL } from "../../../constants/permissions";
import OrganizationSelect from "../../../components/forms/inputs/OrganizationSelect";

const ViewWatchStats: React.FC = () => {
  const [selectedUnits, setSelectedUnits] = useState<Unit[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<
    Organization | undefined
  >();

  const { hasPermissions, accessTokenClaims } = useAuth();
  const { state: trainingState } = useContext(TrainingContext);

  const multipleUnits = useMemo(
    () =>
      hasPermissions([LEVEL.ORGANIZATION, LEVEL.ADMIN], "any") ||
      !!accessTokenClaims?.peer_units?.length,
    [hasPermissions, accessTokenClaims]
  );

  const multipleOrganizations = useMemo(
    () => hasPermissions([LEVEL.ADMIN]),
    [hasPermissions]
  );

  const handleSelectUnits = (event: SimpleChangeEvent<Unit[]>) => {
    setSelectedUnits(event.target?.value ?? []);
  };

  const handleSelectOrganization = (
    event: SimpleChangeEvent<Organization | undefined | null | string>
  ) => {
    setSelectedOrganization(
      (event.target?.value ?? undefined) as Organization | undefined
    );
    setSelectedUnits([]);
  };

  const onSubmitGetWatchStats = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (trainingState.activeCourse?.id) {
      getWatchStats(
        trainingState.activeCourse?.id,
        selectedOrganization?.id,
        selectedUnits.map((u) => u.slug)
      ).then((response) => {
        const a = document.createElement("a");
        a.setAttribute(
          "href",
          window.URL.createObjectURL(new Blob([response]))
        );
        a.setAttribute("download", "watch-stats.csv");
        document.body.append(a);
        a.click();
        a.remove();
      });
    }
  };

  return (
    <>
      <div className="border-b border-gray-200 pb-5 sm:flex sm:items-center mb-8">
        <h1 className="text-base font-semibold leading-6 text-gray-900">
          Watch Stats
        </h1>
      </div>
      <form className="flex flex-col" onSubmit={onSubmitGetWatchStats}>
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">
            Generate Report
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            A report will be generated for all users of the selected units that
            will include the percentages watched of each training item in the
            selected course.
          </p>
        </div>
        <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
          <label className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5">
            Select course
          </label>
          <div className="mt-2 sm:col-span-2 sm:mt-0">
            {trainingState.activeCourse ? (
              <div className="flex flex-col items-start">
                <h3
                  className="text-base font-bold text-gray-900"
                  dangerouslySetInnerHTML={{
                    __html: trainingState.activeCourse.metadata.title,
                  }}
                />
                <p
                  className="text-sm font-medium text-gray-500"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: dangerouslySetInnerHTML is safe
                  dangerouslySetInnerHTML={{
                    __html:
                      trainingState.activeCourse.metadata.description ||
                      "No description.",
                  }}
                />
                <button
                  type="button"
                  className="mt-2 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  Change course
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Select course
              </button>
            )}
          </div>
        </div>
        {multipleOrganizations && (
          <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
            <label className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5">
              Select organization
            </label>
            <div className="mt-2 sm:col-span-2 sm:mt-0">
              <OrganizationSelect
                value={selectedOrganization}
                onChange={handleSelectOrganization}
              />
            </div>
          </div>
        )}
        {multipleUnits && (
          <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
            <label className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5">
              Select units
            </label>
            <div className="mt-2 sm:col-span-2 sm:mt-0">
              <UnitSelect
                many={true}
                value={selectedUnits}
                onChange={handleSelectUnits}
                queryFilter={
                  selectedOrganization && {
                    "organization.id": selectedOrganization.id,
                  }
                }
              />
            </div>
          </div>
        )}
        <button
          type="submit"
          className="mt-4 self-center block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600 transition-colors"
        >
          Generate and Download Report (.csv)
        </button>
      </form>
    </>
  );
};

export default ViewWatchStats;

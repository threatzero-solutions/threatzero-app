import { FormEvent, useContext, useEffect, useMemo, useState } from "react";
import UnitSelect from "../../../components/forms/inputs/UnitSelect";
import { SimpleChangeEvent } from "../../../types/core";
import { Organization, TrainingCourse, Unit } from "../../../types/entities";
import { getWatchStats } from "../../../queries/training-admin";
import { useAuth } from "../../../contexts/AuthProvider";
import { LEVEL } from "../../../constants/permissions";
import OrganizationSelect from "../../../components/forms/inputs/OrganizationSelect";
import { useQuery } from "@tanstack/react-query";
import { getTrainingCourses } from "../../../queries/training";
import { useImmer } from "use-immer";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import Autocomplete from "../../../components/forms/inputs/Autocomplete";
import { CoreContext } from "../../../contexts/core/core-context";
import { stripHtml } from "../../../utils/core";

const displayCourse = (course?: TrainingCourse | null, admin = false) => {
  if (!course) {
    return "";
  }

  return (
    stripHtml(course.metadata.title) +
    " " +
    (admin && course.metadata.tag ? `(${course.metadata.tag})` : "")
  );
};

const ViewWatchStats: React.FC = () => {
  const [selectedUnits, setSelectedUnits] = useState<Unit[]>([]);
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>();
  const [selectedCourse, setSelectedCourse] = useState<
    TrainingCourse | undefined | null
  >();
  const [coursesQuery, setCoursesQuery] = useImmer<ItemFilterQueryParams>({});

  const { hasPermissions, accessTokenClaims } = useAuth();
  const { setInfo } = useContext(CoreContext);

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

  useEffect(() => {
    if (selectedOrganization) {
      setCoursesQuery((q) => {
        q["organizations.id"] = selectedOrganization.id;
      });

      setSelectedCourse(null);
    }
  }, [selectedOrganization]);

  const { data: allCourses } = useQuery({
    queryKey: ["training-courses", coursesQuery] as const,
    queryFn: ({ queryKey }) => getTrainingCourses(queryKey[1]),
  });

  const availableCourses = useMemo(() => {
    if (allCourses) {
      return allCourses.results;
    }
    return [];
  }, [allCourses]);
  const handleSelectUnits = (event: SimpleChangeEvent<Unit[]>) => {
    setSelectedUnits(event.target?.value ?? []);
  };

  const handleSelectOrganization = (
    event: SimpleChangeEvent<Organization | undefined | null | string>
  ) => {
    setSelectedOrganization(
      (event.target?.value ?? null) as Organization | null
    );
    setSelectedUnits([]);
  };

  const onSubmitGetWatchStats = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (selectedCourse) {
      setInfo("Generating report...");
      getWatchStats(
        selectedCourse.id,
        selectedOrganization?.slug,
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

        setTimeout(() => setInfo(), 2000);
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
            A report will be generated for all users{" "}
            {multipleUnits ? "in the selected units" : "in your unit"} that will
            include the percentages watched of each training item in the
            selected course.
          </p>
        </div>
        {multipleOrganizations && (
          <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
            <label className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5">
              1. Select an organization
            </label>
            <div className="mt-2 sm:col-span-2 sm:mt-0">
              <OrganizationSelect
                value={selectedOrganization}
                onChange={handleSelectOrganization}
                required
              />
            </div>
          </div>
        )}
        {multipleUnits && (
          <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
            <label className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5">
              {(multipleOrganizations ? 1 : 0) + 1}. (Optional) Select units
            </label>
            <div className="mt-2 sm:col-span-2 sm:mt-0">
              <UnitSelect
                many={true}
                value={selectedUnits}
                onChange={handleSelectUnits}
                queryFilter={
                  selectedOrganization
                    ? {
                        "organization.id": selectedOrganization.id,
                      }
                    : undefined
                }
              />
            </div>
          </div>
        )}
        <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
          <label className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5">
            {(multipleOrganizations ? 1 : 0) + (multipleUnits ? 1 : 0) + 1}.
            Select course
          </label>
          <div className="mt-2 sm:col-span-2 sm:mt-0">
            <Autocomplete
              value={selectedCourse ?? null}
              onChange={setSelectedCourse}
              onRemove={() => setSelectedCourse(null)}
              setQuery={(s) =>
                setCoursesQuery((q) => {
                  q.search = s;
                })
              }
              options={availableCourses}
              placeholder="Search for course..."
              displayValue={(course) =>
                displayCourse(course, multipleOrganizations)
              }
              immediate
              required
            />
          </div>
        </div>
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

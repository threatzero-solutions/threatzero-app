import { useState } from "react";
import SlideOver from "../../../../../components/layouts/slide-over/SlideOver";
import ManageScormPackages from "./ManageScormPackages";
import {
  type TrainingCourse,
  type CourseEnrollment,
  type Organization,
} from "../../../../../types/entities";
import { getOrganizationLmsTokens } from "../../../../../queries/organizations";
import { useQuery } from "@tanstack/react-query";

interface LmsIntegrationsInputProps {
  organizationId: Organization["id"] | undefined;
  enrollmentId: CourseEnrollment["id"] | undefined;
  courseId: TrainingCourse["id"] | undefined;
  accessSettings?: Organization["trainingAccessSettings"];
}

const LmsIntegrationsInput: React.FC<LmsIntegrationsInputProps> = ({
  organizationId,
  enrollmentId,
  courseId,
  accessSettings,
}) => {
  const [scormPackagesSliderOpen, setScormPackagesSliderOpen] = useState(false);

  const { data: lmsTokens } = useQuery({
    queryKey: [
      "lmsTokens",
      organizationId!,
      enrollmentId,
      { limit: 100 },
    ] as const,
    queryFn: ({ queryKey }) =>
      getOrganizationLmsTokens(queryKey[1], {
        "value.enrollmentId": queryKey[2],
        ...queryKey[3],
      }),
    enabled: !!organizationId && !!enrollmentId,
  });

  return (
    lmsTokens && (
      <>
        <div>
          <h3 className="text-xs font-semibold text-gray-900 mb-2 border-t border-gray-200 pt-4">
            LMS Integrations
          </h3>
          {/* SCORM packages */}
          <button
            className="text-xs text-secondary-500 cursor-pointer"
            type="button"
            onClick={() => setScormPackagesSliderOpen(true)}
          >
            {lmsTokens.count ? (
              <span>Manage ({lmsTokens.count}) SCORM packages &rarr;</span>
            ) : (
              "+ Add SCORM package"
            )}
          </button>
        </div>
        <SlideOver
          open={scormPackagesSliderOpen}
          setOpen={setScormPackagesSliderOpen}
        >
          <ManageScormPackages
            setOpen={setScormPackagesSliderOpen}
            lmsTokens={lmsTokens.results}
            enrollmentId={enrollmentId}
            courseId={courseId}
            organizationId={organizationId}
            accessSettings={accessSettings}
          />
        </SlideOver>
      </>
    )
  );
};

export default LmsIntegrationsInput;

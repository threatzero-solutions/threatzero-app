import { useParams } from "react-router-dom";
import ViewTrainingCourse from "../../training-library/components/ViewTrainingCourse";
import { getTrainingCourse } from "../../../queries/training";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { Organization, TrainingVisibility } from "../../../types/entities";
import BackButtonLink from "../../../components/layouts/BackButtonLink";

const PreviewCourse: React.FC = () => {
  const params = useParams();

  const { data: course, isPending: coursePending } = useQuery({
    queryKey: ["training-courses", params.id],
    queryFn: () => getTrainingCourse(params.id!),
    enabled: !!params.id,
  });

  return (
    <>
      <BackButtonLink to="../" value={"Back to Courses"} className="mx-5" />
      <span className="block text-base font-semibold mx-5 my-4 rounded-md bg-gradient-to-r from-secondary-800 to-secondary-500 text-white py-2 px-4">
        Preview
      </span>
      <ViewTrainingCourse
        course={course}
        loading={coursePending}
        enrollment={
          course && {
            id: "preview",
            course,
            startDate: dayjs().startOf("year").format("YYYY-MM-DD"),
            endDate: dayjs()
              .startOf("year")
              .add(1, "year")
              .format("YYYY-MM-DD"),
            visibility: TrainingVisibility.VISIBLE,
            organization: {} as Organization,
            createdOn: dayjs().format(),
            updatedOn: dayjs().format(),
          }
        }
        showMultipleEnrollments
      />
    </>
  );
};

export default PreviewCourse;

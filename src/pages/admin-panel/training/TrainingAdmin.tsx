import TrainingCourseTable from "./tables/TrainingCourseTable";
import TrainingItemTable from "./tables/TrainingItemTable";

const TrainingAdmin: React.FC = () => {
  return (
    <div className="flex flex-col gap-12">
      <TrainingCourseTable />
      <TrainingItemTable />
    </div>
  );
};

export default TrainingAdmin;

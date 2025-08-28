import Modal from "../../../../../components/layouts/modal/Modal";
import { CourseEnrollment } from "../../../../../types/entities";
import { SectionAndWindow } from "../../../../../types/training";
import TrainingPicker from "./TrainingPicker";

export default function TrainingPickerModal({
  organizationId,
  open,
  setOpen,
  onChangeTrainingData,
}: {
  organizationId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onChangeTrainingData: (data: {
    courseEnrollment: CourseEnrollment;
    sectionAndWindow: SectionAndWindow;
  }) => void;
}) {
  return (
    <Modal
      open={open}
      setOpen={setOpen}
      classNames={{ dialogPanel: "w-full sm:max-w-2xl" }}
    >
      <div className="bg-white px-4 py-4 sm:py-6 rounded-lg h-[32rem] w-full overflow-hidden">
        <TrainingPicker
          organizationId={organizationId}
          onChangeTrainingData={(data) => {
            onChangeTrainingData(data);
            setOpen(false);
          }}
        />
      </div>
    </Modal>
  );
}

import { FormEvent, PropsWithChildren } from "react";
import SlideOverFormActionButtons, {
  SlideOverFormActionButtonsProps,
} from "./SlideOverFormActionButtons";

interface SlideOverFormProps
  extends PropsWithChildren,
    SlideOverFormActionButtonsProps {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

const SlideOverForm: React.FC<SlideOverFormProps> = ({
  onSubmit,
  children,
  ...actionButtonProps
}) => {
  return (
    <form className="flex h-screen flex-col" onSubmit={onSubmit}>
      {children}
      {/* Action buttons */}
      <SlideOverFormActionButtons {...actionButtonProps} />
    </form>
  );
};

export default SlideOverForm;

import { DetailedHTMLProps, TextareaHTMLAttributes } from "react";
import { classNames } from "../../../utils/core";

type TextAreaProps = DetailedHTMLProps<
	TextareaHTMLAttributes<HTMLTextAreaElement>,
	HTMLTextAreaElement
>;

const TextArea: React.FC<TextAreaProps> = ({ className, ...attrs }) => {
	return (
		<textarea
			{...attrs}
			className={classNames(
				"block rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-secondary-600 sm:text-sm sm:leading-6 disabled:text-gray-500",
				className,
			)}
		/>
	);
};

export default TextArea;

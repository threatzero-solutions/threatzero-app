import { DetailedHTMLProps, InputHTMLAttributes } from "react";
import { classNames } from "../../../utils/core";

type InputProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>;

const Input: React.FC<InputProps> = ({ className, ...attrs }) => {
  return (
    <input
      {...attrs}
      className={classNames(
        "block py-1.5 rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-secondary-600 sm:text-sm sm:leading-6 disabled:text-gray-500",
        className
      )}
    />
  );
};

export default Input;

import { ReactNode } from "react";
import { classNames } from "../../../utils/core";

interface AsProp<T extends React.ElementType> {
  as?: T;
}

type IconButtonProps<T extends React.ElementType> = AsProp<T> & {
  icon: React.ElementType;
  className?: string;
  text?: string;
  trailing?: boolean;
} & React.ComponentProps<T>;

const IconButton = <T extends React.ElementType = "button">({
  icon: Icon,
  className,
  as: Component = "button",
  text,
  trailing = false,
  ...props
}: IconButtonProps<T>) => {
  const parts: ReactNode[] = [
    <Icon key="icon" className="block size-4" />,
    <span key="text">{text}</span>,
  ];
  return (
    <Component
      className={classNames(
        "inline-flex gap-1 items-center min-w-max rounded-md px-2.5 py-1.5 text-xs font-semibold shadow-xs ring-1 ring-inset enabled:cursor-pointer transition-colors",
        className
      )}
      {...props}
    >
      {trailing ? parts.reverse() : parts}
    </Component>
  );
};

export default IconButton;

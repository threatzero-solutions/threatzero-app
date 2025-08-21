import { ReactNode } from "react";
import { cn } from "../../../utils/core";

interface AsProp<T extends React.ElementType> {
  as?: T;
}

type IconButtonProps<T extends React.ElementType> = AsProp<T> & {
  icon: React.ElementType;
  className?: string;
  text?: string;
  trailing?: boolean;
  classNames?: {
    icon?: string;
    text?: string;
    button?: string;
  };
} & React.ComponentProps<T>;

const IconButton = <T extends React.ElementType = "button">({
  icon: Icon,
  className,
  as: Component = "button",
  text,
  trailing = false,
  classNames = {},
  ...props
}: IconButtonProps<T>) => {
  const parts: ReactNode[] = [
    <Icon key="icon" className={cn("block size-4", classNames.icon)} />,
    <span key="text" className={cn("text-xs font-semibold", classNames.text)}>
      {text}
    </span>,
  ];
  return (
    <Component
      className={cn(
        "inline-flex gap-1 items-center min-w-max rounded-md px-2.5 py-1.5 text-xs font-semibold shadow-xs ring-1 ring-inset enabled:cursor-pointer transition-colors",
        className,
        classNames.button
      )}
      {...props}
    >
      {trailing ? parts.reverse() : parts}
    </Component>
  );
};

export default IconButton;

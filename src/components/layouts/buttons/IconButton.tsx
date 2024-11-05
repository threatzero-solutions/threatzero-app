import { classNames } from "../../../utils/core";

interface AsProp<T extends React.ElementType> {
  as?: T;
}

type IconButtonProps<T extends React.ElementType> = AsProp<T> & {
  icon: React.ElementType;
  className?: string;
  text?: string;
} & React.ComponentProps<T>;

const IconButton = <T extends React.ElementType = "button">({
  icon: Icon,
  className,
  as: Component = "button",
  text,
  ...props
}: IconButtonProps<T>) => {
  return (
    <Component
      className={classNames(
        "inline-flex gap-1 items-center min-w-max rounded-md px-2.5 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-inset cursor-pointer transition-colors",
        className
      )}
      {...props}
    >
      <Icon className="block size-4" />
      {text}
    </Component>
  );
};

export default IconButton;

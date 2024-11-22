import { classNames } from "../../../utils/core";
import { XMarkIcon } from "@heroicons/react/20/solid";
import Input from "./Input";
import { useRef } from "react";

export interface SearchInputProps {
  placeholder?: string;
  setSearchQuery: (query: string) => void;
  searchQuery?: string;
  fullWidth?: boolean;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder,
  setSearchQuery,
  searchQuery,
  fullWidth,
  className,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={classNames(
        "relative w-full",
        fullWidth ? "" : "max-w-80",
        className
      )}
    >
      <Input
        ref={inputRef}
        type="search"
        className={classNames("w-full pr-10")}
        placeholder={placeholder ?? "Search..."}
        onChange={(e) => setSearchQuery?.(e.target.value)}
        value={searchQuery}
      />
      <div
        className={classNames(
          inputRef.current?.value.length
            ? "opacity-100"
            : "pointer-events-none opacity-0",
          "cursor-pointer absolute inset-y-0 right-0 flex items-center pr-3 hover:opacity-75 transition-opacity"
        )}
        onClick={() => {
          if (!searchQuery && inputRef.current) {
            inputRef.current.value = "";
          }
          setSearchQuery?.("");
        }}
      >
        <XMarkIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </div>
    </div>
  );
};

export default SearchInput;

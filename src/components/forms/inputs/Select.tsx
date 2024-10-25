import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import {
  SelectHTMLAttributes,
  DetailedHTMLProps,
  Fragment,
  useState,
  useEffect,
  ReactNode,
  ChangeEvent,
} from "react";
import { classNames } from "../../../utils/core";

interface SelectProps
  extends DetailedHTMLProps<
    SelectHTMLAttributes<HTMLSelectElement>,
    HTMLSelectElement
  > {
  options: {
    key: string;
    label: ReactNode;
    disabled?: boolean;
    disabledText?: string;
  }[];
  readOnly?: boolean;
  showClear?: boolean;
}

const Select: React.FC<SelectProps> = ({ options, showClear, ...attrs }) => {
  const { name, defaultValue, value, readOnly, disabled } = attrs;

  const [selected, setSelected] = useState(defaultValue as string);

  useEffect(() => {
    setSelected(value as string);
  }, [value]);

  const handleSelect = (v: any) => {
    if (readOnly || disabled) {
      return;
    }

    setSelected(v);

    attrs.onChange?.({
      ...new Event("change"),
      target: {
        ...attrs,
        name: name ?? "",
        value: v,
        getAttribute: (key: keyof typeof attrs) => attrs[key],
      },
    } as unknown as ChangeEvent<HTMLSelectElement>);
  };

  return (
    <div className="w-full">
      <Listbox
        defaultValue={defaultValue}
        value={value}
        name={name}
        onChange={handleSelect}
        disabled={disabled}
      >
        {({ open }) => (
          <>
            <div className="relative">
              <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-secondary-600 sm:text-sm sm:leading-6">
                <span
                  className={classNames(
                    "block truncate",
                    disabled ? "opacity-50 cursor-not-allowed" : ""
                  )}
                >
                  {selected
                    ? options.find(({ key }) => key === selected)?.label
                    : "Select one"}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </span>
              </ListboxButton>

              <Transition
                show={open}
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {options.map(({ key, label, disabled, disabledText }) => (
                    <ListboxOption
                      key={key}
                      className={({ focus }) =>
                        classNames(
                          focus && !readOnly
                            ? "bg-secondary-600 text-white"
                            : "text-gray-900",
                          "relative cursor-default select-none py-2 pl-3 pr-9"
                        )
                      }
                      value={key}
                      disabled={disabled}
                      title={
                        disabled
                          ? disabledText
                          : typeof label === "string"
                          ? label
                          : ""
                      }
                    >
                      {({ selected, focus }) => (
                        <>
                          <span
                            className={classNames(
                              selected ? "font-semibold" : "font-normal",
                              "block truncate"
                            )}
                          >
                            {label}
                          </span>

                          {selected ? (
                            <span
                              className={classNames(
                                focus ? "text-white" : "text-secondary-600",
                                "absolute inset-y-0 right-0 flex items-center pr-4"
                              )}
                            >
                              <CheckIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </span>
                          ) : null}
                        </>
                      )}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </Transition>
            </div>
          </>
        )}
      </Listbox>
      {showClear && (
        <button
          type="button"
          className={classNames(
            "pl-1 text-xs font-semibol text-secondary-600 disabled:text-gray-400"
          )}
          disabled={!value}
          onClick={() => handleSelect(undefined)}
        >
          clear
        </button>
      )}
    </div>
  );
};

export default Select;

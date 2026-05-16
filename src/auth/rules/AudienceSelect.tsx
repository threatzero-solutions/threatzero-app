import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Fragment } from "react";
import { Audience } from "../../types/entities";
import { classNames } from "../../utils/core";

export interface AudienceSelectProps {
  value: string;
  onChange: (v: string) => void;
  activeAudiences: Audience[];
  inactiveAudiences?: Audience[];
  showInactive?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Training-group picker. Mirrors the shared `Select` look-and-feel but
 * supports grouped options — system admins see Active audiences (tied
 * to an enrolled course in this org) on top and Inactive ones below.
 * Non-admins only ever see active.
 */
export const AudienceSelect: React.FC<AudienceSelectProps> = ({
  value,
  onChange,
  activeAudiences,
  inactiveAudiences = [],
  showInactive = false,
  placeholder = "Select a training group",
  disabled,
}) => {
  const all = [...activeAudiences, ...(showInactive ? inactiveAudiences : [])];
  const selected = all.find((a) => a.id === value);

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      {({ open }) => (
        <div className="relative">
          <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 focus:outline-hidden focus:ring-2 focus:ring-secondary-600 sm:text-sm sm:leading-6 disabled:bg-gray-50 disabled:text-gray-500">
            <span className="block truncate">
              {selected ? (
                selected.slug
              ) : (
                <span className="text-gray-400">{placeholder}</span>
              )}
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
            <ListboxOptions
              anchor={{ to: "bottom start", gap: 4 }}
              className="z-30 max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-hidden sm:text-sm [width:var(--button-width)]"
            >
              {showInactive ? (
                <>
                  <GroupHeader label="Active — in use by enrolled courses" />
                  {activeAudiences.length === 0 && (
                    <EmptyRow>
                      No training groups are currently tied to enrolled courses.
                    </EmptyRow>
                  )}
                  {activeAudiences.map((a) => (
                    <AudienceRow key={a.id} audience={a} />
                  ))}
                  <GroupHeader label="Inactive — not in any enrolled course" />
                  {inactiveAudiences.length === 0 && (
                    <EmptyRow>No other training groups exist.</EmptyRow>
                  )}
                  {inactiveAudiences.map((a) => (
                    <AudienceRow key={a.id} audience={a} muted />
                  ))}
                </>
              ) : (
                <>
                  {activeAudiences.length === 0 && (
                    <EmptyRow>
                      No training groups are available. Enroll in a course
                      first.
                    </EmptyRow>
                  )}
                  {activeAudiences.map((a) => (
                    <AudienceRow key={a.id} audience={a} />
                  ))}
                </>
              )}
            </ListboxOptions>
          </Transition>
        </div>
      )}
    </Listbox>
  );
};

function AudienceRow({
  audience,
  muted,
}: {
  audience: Audience;
  muted?: boolean;
}) {
  return (
    <ListboxOption
      className={({ focus }) =>
        classNames(
          focus ? "bg-secondary-600 text-white" : "text-gray-900",
          muted ? "italic" : "",
          "relative cursor-default select-none py-2 pl-3 pr-9",
        )
      }
      value={audience.id}
    >
      {({ selected, focus }) => (
        <>
          <span
            className={classNames(
              selected ? "font-semibold" : "font-normal",
              "block truncate",
            )}
          >
            {audience.slug}
          </span>
          {selected && (
            <span
              className={classNames(
                focus ? "text-white" : "text-secondary-600",
                "absolute inset-y-0 right-0 flex items-center pr-4",
              )}
            >
              <CheckIcon className="h-5 w-5" aria-hidden="true" />
            </span>
          )}
        </>
      )}
    </ListboxOption>
  );
}

function GroupHeader({ label }: { label: string }) {
  return (
    <div className="px-3 pt-2 pb-1 text-[0.6875rem] font-semibold uppercase tracking-wider text-gray-500">
      {label}
    </div>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-2 text-sm text-gray-400 italic">{children}</div>
  );
}

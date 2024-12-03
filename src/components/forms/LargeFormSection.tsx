import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { PropsWithChildren } from "react";

const LargeFormSection: React.FC<
  PropsWithChildren<{
    heading: string;
    subheading?: string;
    defaultOpen?: boolean;
  }>
> = ({ heading, subheading, defaultOpen = false, children }) => {
  return (
    <Disclosure defaultOpen={defaultOpen} as="div">
      <DisclosureButton className="group text-base font-semibold text-gray-900 hover:text-gray-600 mb-2 inline-flex justify-between items-center rounded-lg bg-gray-200 px-4 py-2 w-full">
        <span className="text-start">
          <span>{heading}</span>
          <span className="block text-sm text-gray-500 font-normal">
            {subheading}
          </span>
        </span>
        <ChevronDownIcon className="size-5 group-data-[open]:rotate-180" />
      </DisclosureButton>
      <DisclosurePanel className="rounded-lg bg-white ring-1 ring-gray-900/5 p-4">
        {children}
      </DisclosurePanel>
    </Disclosure>
  );
};

export default LargeFormSection;

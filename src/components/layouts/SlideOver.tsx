import React, { Fragment, PropsWithChildren } from "react";
import { Dialog, Transition } from "@headlessui/react";

interface SlideOverProps extends PropsWithChildren {
	open: boolean;
	setOpen: (open: boolean) => void;
	unmount?: boolean;
}

const SlideOver: React.FC<SlideOverProps> = ({
	open,
	setOpen,
	unmount,
	children,
}) => {
	return (
		<Transition.Root show={open} as={Fragment}>
			<Dialog
				as="div"
				className="relative z-30"
				onClose={setOpen}
				unmount={unmount}
			>
				<div className="fixed inset-0" />

				<div className="fixed inset-0 overflow-hidden">
					<div className="absolute inset-0 overflow-hidden">
						<div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
							<Transition.Child
								as={Fragment}
								enter="transform transition ease-in-out duration-500 sm:duration-700"
								enterFrom="translate-x-full"
								enterTo="translate-x-0"
								leave="transform transition ease-in-out duration-500 sm:duration-700"
								leaveFrom="translate-x-0"
								leaveTo="translate-x-full"
							>
								<Dialog.Panel className="pointer-events-auto w-screen max-w-2xl overflow-y-scroll bg-white shadow-xl h-full">
									{children}
								</Dialog.Panel>
							</Transition.Child>
						</div>
					</div>
				</div>
			</Dialog>
		</Transition.Root>
	);
};

export default SlideOver;

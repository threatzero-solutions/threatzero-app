import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import Modal from "./Modal";
import { DialogTitle } from "@headlessui/react";
import { ModalProps } from "./Modal";
import { classNames } from "../../../utils/core";

export interface ConfirmationModalProps extends Omit<ModalProps, "children"> {
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  destructive?: boolean;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  setOpen,
  title,
  message,
  onConfirm,
  destructive = false,
  confirmText = "Confirm",
  cancelText = "Cancel",
  ...modalProps
}) => {
  return (
    <Modal {...modalProps} setOpen={setOpen}>
      <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
        <div className="sm:flex sm:items-start">
          <div
            className={classNames(
              "mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10",
              destructive ? "bg-red-100" : "bg-secondary-100"
            )}
          >
            {destructive ? (
              <ExclamationTriangleIcon
                aria-hidden="true"
                className="h-6 w-6 text-red-600"
              />
            ) : (
              <InformationCircleIcon
                aria-hidden="true"
                className="h-6 w-6 text-secondary-600"
              />
            )}
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <DialogTitle
              as="h3"
              className="text-base font-semibold leading-6 text-gray-900"
            >
              {title}
            </DialogTitle>
            <div className="mt-2 text-sm text-gray-500">
              {typeof message === "string" ? (
                <p className="text-sm text-gray-500">{message}</p>
              ) : (
                message
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
        <button
          type="button"
          onClick={onConfirm}
          className={classNames(
            "inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto",
            destructive
              ? "bg-red-600 hover:bg-red-500"
              : "bg-secondary-600 hover:bg-secondary-500"
          )}
        >
          {confirmText}
        </button>
        <button
          type="button"
          data-autofocus
          onClick={() => setOpen(false)}
          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
        >
          {cancelText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;

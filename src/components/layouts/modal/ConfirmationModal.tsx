import { DialogTitle } from "@headlessui/react";
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { classNames } from "../../../utils/core";
import Input from "../../forms/inputs/Input";
import Modal, { ModalProps } from "./Modal";

export interface ConfirmationModalProps extends Omit<ModalProps, "children"> {
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel?: () => void;
  destructive?: boolean;
  confirmText?: string;
  cancelText?: string;
  isPending?: boolean;
  requireTextInput?: boolean;
  textInputPrompt?: string;
  textInputPlaceholder?: string;
  validateTextInput?: (text: string) => boolean;
  onTextInputChange?: (text: string) => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  setOpen,
  title,
  message,
  onConfirm,
  onCancel,
  destructive = false,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isPending = false,
  requireTextInput = false,
  textInputPrompt = "Please enter a reason:",
  textInputPlaceholder = "",
  validateTextInput = () => true,
  onTextInputChange,
  ...modalProps
}) => {
  const [confirmDisabled, setConfirmDisabled] = useState(requireTextInput);

  return (
    <Modal {...modalProps} setOpen={setOpen}>
      <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 rounded-t-lg">
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
            <div className="mt-2 text-sm text-gray-500 space-y-4">
              {typeof message === "string" ? (
                <p className="text-sm text-gray-500">{message}</p>
              ) : (
                <div>{message}</div>
              )}
              {requireTextInput && (
                <div className="space-y-2 w-full">
                  <span className="font-bold">{textInputPrompt}</span>
                  <Input
                    type="text"
                    placeholder={textInputPlaceholder}
                    className="w-full"
                    onChange={(e) => {
                      onTextInputChange?.(e.target.value);
                      setConfirmDisabled(!validateTextInput(e.target.value));
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 rounded-b-lg px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirmDisabled || isPending}
          className={classNames(
            "inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto disabled:opacity-50",
            destructive
              ? "bg-red-600 enabled:hover:bg-red-500"
              : "bg-secondary-600 enabled:hover:bg-secondary-500",
            isPending ? "animate-pulse" : ""
          )}
        >
          {confirmText}
        </button>
        <button
          type="button"
          data-autofocus
          onClick={() => (onCancel ? onCancel() : setOpen(false))}
          disabled={isPending}
          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 enabled:hover:bg-gray-50 disabled:opacity-50 sm:mt-0 sm:w-auto"
        >
          {cancelText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;

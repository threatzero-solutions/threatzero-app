import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Language, Field, FieldType } from "../../../types/entities";
import { orderSort } from "../../../utils/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveLanguage, deleteLanguage } from "../../../queries/languages";
import FormInput from "../../../components/forms/inputs/FormInput";

const INPUT_DATA: Array<Partial<Field> & { name: keyof Language }> = [
  {
    name: "name",
    label: "Name",
    helpText: "The English display name for this language.",
    type: FieldType.TEXT,
    required: true,
    order: 0,
  },
  {
    name: "nativeName",
    label: "Native Name",
    type: FieldType.TEXT,
    helpText: "The language name as displayed in native language.",
    required: true,
    order: 1,
  },
  {
    name: "code",
    label: "Language Code",
    type: FieldType.TEXT,
    helpText: "The ISO 639-1 code for this language (e.g. en, es).",
    required: true,
    order: 2,
  },
];

interface EditLanguageProps {
  setOpen: (open: boolean) => void;
  language?: Partial<Language>;
}

const EditLanguage: React.FC<EditLanguageProps> = ({
  setOpen,
  language: languageProp,
}) => {
  const [language, setLanguage] = useState<Partial<Language>>({});

  const isNew = useMemo(() => !languageProp, [languageProp]);

  const queryClient = useQueryClient();
  const onMutateSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ["languages"],
    });
    setOpen(false);
  };
  const saveLanguageMutation = useMutation({
    mutationFn: saveLanguage,
    onSuccess: onMutateSuccess,
  });

  const deleteLanguageMutation = useMutation({
    mutationFn: deleteLanguage,
    onSuccess: onMutateSuccess,
  });

  useEffect(() => {
    setLanguage((a) => ({
      ...a,
      ...(languageProp ?? {}),
    }));
  }, [languageProp]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;

    setLanguage((a) => ({
      ...a,
      [event.target.name]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    saveLanguageMutation.mutate(language);
  };

  const handleDelete = () => {
    deleteLanguageMutation.mutate(language.id);
  };

  return (
    <form className="flex h-full flex-col" onSubmit={handleSubmit}>
      <div className="flex-1">
        {/* Header */}
        <div className="bg-gray-50 px-4 py-6 sm:px-6">
          <div className="flex items-start justify-between space-x-3">
            <div className="space-y-1">
              <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                {isNew ? "Add language" : "Edit language"}
              </Dialog.Title>
              <p className="text-sm text-gray-500">
                Languages are used for displaying content in different locales.
              </p>
            </div>
            <div className="flex h-7 items-center">
              <button
                type="button"
                className="relative text-gray-400 hover:text-gray-500"
                onClick={() => setOpen(false)}
              >
                <span className="absolute -inset-2.5" />
                <span className="sr-only">Close panel</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Divider container */}
        <div className="space-y-6 py-6 sm:space-y-0 sm:divide-y sm:divide-gray-200 sm:py-0">
          {INPUT_DATA.sort(orderSort).map((input) => (
            <div
              key={input.name}
              className="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5"
            >
              <div>
                <label
                  htmlFor={input.name}
                  className="block text-sm font-medium leading-6 text-gray-900 sm:mt-1.5"
                >
                  {input.label}
                </label>
              </div>
              <div className="sm:col-span-2 space-y-2">
                <FormInput
                  field={input}
                  onChange={handleChange}
                  value={language[input.name as keyof Language] ?? ""}
                />
                {input.helpText && (
                  <p className="text-sm text-gray-500">{input.helpText}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex-shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="flex space-x-3">
          {!isNew && (
            <button
              type="button"
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-red-500"
              onClick={handleDelete}
            >
              Delete
            </button>
          )}
          <div className="grow" />
          <button
            type="button"
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
          >
            {isNew ? "Add" : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default EditLanguage;

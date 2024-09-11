import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Language, Field, FieldType } from "../../../types/entities";
import { orderSort } from "../../../utils/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveLanguage, deleteLanguage } from "../../../queries/languages";
import FormInput from "../../../components/forms/inputs/FormInput";
import SlideOverForm from "../../../components/layouts/slide-over/SlideOverForm";
import SlideOverHeading from "../../../components/layouts/slide-over/SlideOverHeading";
import SlideOverFormBody from "../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverField from "../../../components/layouts/slide-over/SlideOverField";

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
    <SlideOverForm
      onSubmit={handleSubmit}
      onClose={() => setOpen(false)}
      hideDelete={isNew}
      onDelete={handleDelete}
      submitText={isNew ? "Add" : "Update"}
      isSaving={saveLanguageMutation.isPending}
    >
      <SlideOverHeading
        title={isNew ? "Add language" : "Edit language"}
        description={
          "Languages are used for displaying content in different locales."
        }
        setOpen={setOpen}
      />
      <SlideOverFormBody>
        {INPUT_DATA.sort(orderSort).map((input) => (
          <SlideOverField
            key={input.name}
            label={input.label}
            name={input.name}
            helpText={input.helpText}
          >
            <FormInput
              field={input}
              onChange={handleChange}
              value={language[input.name as keyof Language] ?? ""}
            />
          </SlideOverField>
        ))}
      </SlideOverFormBody>
    </SlideOverForm>
  );
};

export default EditLanguage;

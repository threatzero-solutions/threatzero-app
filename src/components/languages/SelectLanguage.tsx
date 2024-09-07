import { useState } from "react";
import { Language } from "../../types/entities";
import Autocomplete from "../forms/inputs/Autocomplete";
import SlideOverHeading from "../layouts/slide-over/SlideOverHeading";
import { useQuery } from "@tanstack/react-query";
import { getLanguages } from "../../queries/languages";
import { Link } from "react-router-dom";
import SlideOverFormBody from "../layouts/slide-over/SlideOverFormBody";
import SlideOverForm from "../layouts/slide-over/SlideOverForm";
import SlideOverField from "../layouts/slide-over/SlideOverField";

interface SelectLanguageProps {
  setOpen: (open: boolean) => void;
  setLanguage: (language: Language) => void;
  language?: Language;
}

const SelectLanguage: React.FC<SelectLanguageProps> = ({
  setOpen,
  setLanguage,
  language,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(
    language ?? null
  );
  const [languagesQuery, setLanguagesQuery] = useState<string>("");

  const { data: languages } = useQuery({
    queryKey: ["languages", languagesQuery],
    queryFn: ({ queryKey }) => getLanguages({ search: queryKey[1], limit: 5 }),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedLanguage) {
      setLanguage(selectedLanguage);
      setOpen(false);
    }
  };

  return (
    <SlideOverForm
      onSubmit={handleSubmit}
      onClose={() => setOpen(false)}
      submitText="Select"
    >
      <SlideOverHeading
        title="Select Language"
        description=""
        setOpen={setOpen}
      />
      <SlideOverFormBody>
        <SlideOverField label="Language" name="language">
          <Autocomplete
            value={selectedLanguage}
            onChange={setSelectedLanguage}
            options={languages?.results || []}
            setQuery={setLanguagesQuery}
            displayValue={(l) => (l ? l.name : "")}
          />
          <p className="text-sm">
            Not finding the language you're looking for?{" "}
            <Link
              to="/admin-panel/languages"
              className="text-secondary-600 hover:text-secondary-500"
            >
              Add a new one here.
            </Link>
          </p>
        </SlideOverField>
      </SlideOverFormBody>
    </SlideOverForm>
  );
};

export default SelectLanguage;

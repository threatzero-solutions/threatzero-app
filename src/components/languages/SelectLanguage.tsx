import { useState } from "react";
import { Language } from "../../types/entities";
import Autocomplete from "../forms/inputs/Autocomplete";
import SlideOverHeading from "../layouts/slide-over/SlideOverHeading";
import { useQuery } from "@tanstack/react-query";
import { getLanguages } from "../../queries/languages";
import { Link } from "react-router-dom";

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
    <form className="flex h-full flex-col" onSubmit={handleSubmit}>
      <div className="flex-1">
        <SlideOverHeading
          title="Select Language"
          description=""
          setOpen={setOpen}
        />

        {/* Divider container */}
        <div className="space-y-6 py-6 sm:space-y-0 sm:divide-y sm:divide-gray-200 sm:py-0">
          <div className="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
            <div>
              <label
                htmlFor={"language"}
                className="block text-sm font-medium leading-6 text-gray-900 sm:mt-1.5"
              >
                Language
              </label>
            </div>
            <div className="sm:col-span-2 space-y-2">
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
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex-shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="flex space-x-3">
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
            Select
          </button>
        </div>
      </div>
    </form>
  );
};

export default SelectLanguage;

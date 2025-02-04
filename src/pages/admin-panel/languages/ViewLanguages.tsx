import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useImmer } from "use-immer";
import { useDebounceValue } from "usehooks-ts";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import DataTable from "../../../components/layouts/tables/DataTable";
import { ItemFilterQueryParams } from "../../../hooks/use-item-filter-query";
import { getLanguages } from "../../../queries/languages";
import { Language } from "../../../types/entities";
import EditLanguage from "./EditLanguage";

export const ViewLanguages: React.FC = () => {
  const [editLanguageSliderOpen, setEditLanguageSliderOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<
    Partial<Language> | undefined
  >();

  const [languagesQuery, setLanguagesQuery] = useImmer<ItemFilterQueryParams>(
    {}
  );
  const [debouncedLanguagesQuery] = useDebounceValue(languagesQuery, 500);

  const { data: languages, isLoading: languagesLoading } = useQuery({
    queryKey: ["languages", debouncedLanguagesQuery] as const,
    queryFn: ({ queryKey }) => getLanguages(queryKey[1]),
  });

  /*************  ✨ Codeium Command ⭐  *************/
  /******  d5736b23-724c-4ce5-a190-a1ca75679811  *******/
  const handleEditLanguage = (language?: Language) => {
    setSelectedLanguage(language);
    setEditLanguageSliderOpen(true);
  };

  return (
    <>
      <DataTable
        data={{
          headers: [
            {
              label: "Language Code",
              key: "code",
            },
            {
              label: "Name",
              key: "name",
            },
            {
              label: "Native Name",
              key: "nativeName",
            },
            {
              label: <span className="sr-only">Edit</span>,
              key: "edit",
              align: "right",
              noSort: true,
            },
          ],
          rows: (languages?.results ?? []).map((language) => ({
            id: language.id,
            code: language.code,
            name: language.name,
            nativeName: language.nativeName,
            edit: (
              <button
                type="button"
                className="text-secondary-600 hover:text-secondary-900 font-medium"
                onClick={() => handleEditLanguage(language)}
              >
                Edit
                <span className="sr-only">, {language.id}</span>
              </button>
            ),
          })),
        }}
        isLoading={languagesLoading}
        title="Languages"
        subtitle="View, add or edit languages used for displaying content for different locales."
        itemFilterQuery={languagesQuery}
        setItemFilterQuery={setLanguagesQuery}
        paginationOptions={{
          ...languages,
        }}
        searchOptions={{
          searchQuery: languagesQuery.search ?? "",
          setSearchQuery: (search) => {
            setLanguagesQuery((q) => {
              q.search = search;
              q.offset = 0;
            });
          },
        }}
        notFoundDetail="No languages found."
        action={
          <button
            type="button"
            className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-secondary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
            onClick={() => handleEditLanguage()}
          >
            + Add New Language
          </button>
        }
      />
      <SlideOver
        open={editLanguageSliderOpen}
        setOpen={setEditLanguageSliderOpen}
      >
        <EditLanguage
          setOpen={setEditLanguageSliderOpen}
          language={selectedLanguage}
        />
      </SlideOver>
    </>
  );
};

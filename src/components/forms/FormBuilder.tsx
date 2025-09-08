import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router";
import { formBuilderPermissionsOptions } from "../../constants/permission-options";
import { FormsContext } from "../../contexts/forms/forms-context";
import { withRequirePermissions } from "../../guards/with-require-permissions";
import { getForm, getForms, saveForm } from "../../queries/forms";
import { getLanguages } from "../../queries/languages";
import { Language } from "../../types/entities";
import Form from "./Form";

const FormBuilder: React.FC = withRequirePermissions(() => {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const { dispatch } = useContext(FormsContext);

  const { data: allForms, isLoading: isLoadingAllForms } = useQuery({
    queryKey: ["form", params.slug],
    queryFn: ({ queryKey }) => getForms({ slug: queryKey[1] }),
  });

  const selectedLanguageCode = useMemo(
    () => searchParams.get("language") ?? "en",
    [searchParams]
  );
  const selectedVersion = useMemo(() => searchParams.get("v"), [searchParams]);

  const selectedFormId = useMemo(() => {
    if (!allForms) return undefined;

    if (allForms.results.length) {
      const formsForLanguage = allForms.results.filter(
        (_f) => selectedLanguageCode === _f.language?.code
      );
      formsForLanguage.sort((a, b) => b.version - a.version);
      const f =
        formsForLanguage.find((_f) => _f.version + "" === selectedVersion) ??
        formsForLanguage[0];

      if (!f && selectedLanguageCode) {
        return undefined;
      }

      return f.id;
    }

    return null;
  }, [allForms, selectedLanguageCode, selectedVersion]);

  const queryClient = useQueryClient();
  const { data: form, isLoading: isLoadingSelectedForm } = useQuery({
    queryKey: ["form", params.slug, selectedFormId] as const,
    queryFn: ({ queryKey }) =>
      queryKey[2]
        ? getForm(queryKey[2])
        : getLanguages({ code: "en" })
            .then((languages) =>
              saveForm({ slug: queryKey[1], language: languages.results[0] })
            )
            .then((f) => {
              setSearchParams((p) => {
                p.set("v", f.version + "");
                return p;
              });
              queryClient.invalidateQueries({
                queryKey: ["form", queryKey[1]],
              });
              return f;
            }),
    enabled: selectedFormId !== undefined,
  });

  useEffect(() => {
    dispatch({
      type: "SET_ACTIVE_FORM",
      payload: form,
    });
  }, [form, dispatch]);

  return (
    <div>
      <Form
        form={form}
        isBuilding={true}
        readOnly={true}
        isLoading={
          selectedFormId !== null &&
          (isLoadingAllForms || isLoadingSelectedForm)
        }
        versions={allForms?.results
          .filter((f) => f.language.code === selectedLanguageCode)
          .map((f) => f.version)}
        languages={
          allForms
            ? Array.from(
                allForms.results
                  .reduce((langsMap, f) => {
                    if (!langsMap.has(f.language?.code)) {
                      langsMap.set(f.language?.code, f.language);
                    }
                    return langsMap;
                  }, new Map<string, Language>())
                  .values()
              )
            : undefined
        }
        mediaUploadUrl=""
      />
    </div>
  );
}, formBuilderPermissionsOptions);

export default FormBuilder;

import {
  ChangeEvent,
  useState,
  useEffect,
  useContext,
  useMemo,
  ReactNode,
  useCallback,
} from "react";
import {
  Field,
  FieldGroup as FieldGroupEntity,
  FieldResponse,
  FieldType,
  Form as FormEntity,
  FormState,
  FormSubmission,
  Language,
} from "../../types/entities";
import FormField from "./FormField";
import { FormsContext } from "../../contexts/forms/forms-context";
import AddNew from "./builder/AddNew";
import { classNames, noMutateSort, orderSort } from "../../utils/core";
import PillBadge from "../PillBadge";
import { CheckIcon, TrashIcon } from "@heroicons/react/20/solid";
import Dropdown from "../layouts/Dropdown";
import { useSearchParams } from "react-router-dom";
import FieldGroup from "./FieldGroup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteForm, newDraftForm, saveForm } from "../../queries/forms";
import { produce } from "immer";
import Steps from "./Steps";
import React from "react";
import { AlertContext } from "../../contexts/alert/alert-context";
import SlideOver from "../layouts/slide-over/SlideOver";
import SelectLanguage from "../languages/SelectLanguage";
import { DeepPartial } from "../../types/core";
import { useDebounceCallback } from "usehooks-ts";

export interface FormAction {
  id: string;
  type: "submit" | "button" | "reset";
  value: ReactNode;
  className?: string;
  action?: (
    event?: React.MouseEvent<HTMLButtonElement>
  ) => Promise<void> | void;
  order?: number;
  autoExecute?: boolean;
  autoExecuteDebounceTime?: number;
  autoExecuteProgressText?: string;
  autoExecuteLoading?: boolean;
  ref?: React.RefObject<HTMLButtonElement>;
}

interface FormProps {
  form?: Partial<FormEntity>;
  onSubmit?: (
    event: React.FormEvent<HTMLFormElement>,
    submission: DeepPartial<FormSubmission>
  ) => Promise<void> | void;
  actions?: FormAction[];
  submission?: FormSubmission;
  readOnly?: boolean;
  collapsedSteps?: boolean;

  isBuilding?: boolean;
  isLoading?: boolean;
  versions?: number[];
  languages?: Language[];

  setLanguage?: (language: Language) => void;

  background?: string;

  mediaUploadUrl: string;
}

const DEFAULT_AUTO_EXECUTE_DEBOUNCE_TIME = 1000;
const AUTO_EXECUTE_LOADING_MS = 1000;

const Form: React.FC<FormProps> = ({
  form: formData,
  onSubmit,
  actions: actionsProp,
  submission,
  readOnly,
  isBuilding: isBuildingProp,
  isLoading,
  versions,
  languages,
  setLanguage,
  collapsedSteps,
  background = "bg-gray-50",
  mediaUploadUrl,
}) => {
  const [form, setForm] = useState<Partial<FormEntity>>({});
  const fieldGroups = useMemo(
    () => noMutateSort(form?.groups, orderSort),
    [form]
  );
  const [fieldResponses, setFieldResponses] = useState<{
    [key: string]: FieldResponse;
  }>({});
  const [fieldResponsesLoaded, setFieldResponsesLoaded] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [selectLanguageSliderOpen, setSelectLanguageSliderOpen] =
    useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const currentGroupIdx = useMemo(
    () => +(searchParams.get("step") ?? "1") - 1,
    [searchParams]
  );
  const setCurrentGroupIdx = useCallback(
    (step: number) =>
      setSearchParams(
        (p) => {
          p.set("step", (step + 1).toString());
          return p;
        },
        { replace: true }
      ),
    [setSearchParams]
  );

  const { dispatch: formsDispatch } = useContext(FormsContext);
  const { setError } = useContext(AlertContext);

  const published = useMemo(() => form?.state === FormState.PUBLISHED, [form]);

  const isBuilding = useMemo(
    () => !isPreviewing && isBuildingProp,
    [isBuildingProp, isPreviewing]
  );

  const formActions = useMemo(() => {
    let actions = actionsProp;
    if (!actions) {
      actions = [
        {
          id: "submit",
          type: "submit",
          value: "Submit",
        },
      ];
    }

    actions = actions.map((a) => {
      if (!a.ref) {
        a.ref = React.createRef();
      }
      return a;
    });

    return actions;
  }, [actionsProp]);

  const autoExecuteAction = useMemo(
    () => formActions?.find((a) => a.autoExecute),
    [formActions]
  );
  const [autoExecuteLoading, setAutoExecuteLoading] = useState(false);

  useEffect(() => {
    return () => {
      setFieldResponses({});
      setFieldResponsesLoaded(false);
    };
  }, []);

  useEffect(() => {
    if (autoExecuteAction?.autoExecuteLoading !== undefined) {
      if (autoExecuteAction.autoExecuteLoading) {
        setAutoExecuteLoading(true);
      } else {
        setTimeout(() => setAutoExecuteLoading(false), AUTO_EXECUTE_LOADING_MS);
      }
    }
  }, [autoExecuteAction]);

  useEffect(() => {
    if (formData) {
      setForm(
        produce((f) => {
          Object.assign(f, formData);
        })
      );
    }
  }, [formData]);

  useEffect(() => {
    if (submission && fieldResponsesLoaded) {
      return;
    }

    setFieldResponses(
      (submission?.fieldResponses ?? []).reduce((acc, response) => {
        acc[response.field.id] = {
          ...response,
          field: {
            id: response.field.id,
          } as Field,
        };
        return acc;
      }, {} as Record<string, FieldResponse>)
    );

    setFieldResponsesLoaded(!!submission);
  }, [submission, fieldResponsesLoaded]);

  const handleAutoExecute = useCallback(
    async (action: FormAction) => {
      setAutoExecuteLoading(true);
      if (!action.action) {
        action.ref?.current?.click();
      } else {
        try {
          await action.action();
        } catch (e) {
          setError(`${e}`);
        }
        if (action.autoExecuteLoading === undefined) {
          setTimeout(
            () => setAutoExecuteLoading(false),
            AUTO_EXECUTE_LOADING_MS
          );
        }
      }
    },
    [setError, setAutoExecuteLoading]
  );

  const debouncedAutoExecute = useDebounceCallback(
    handleAutoExecute,
    autoExecuteAction?.autoExecuteDebounceTime ??
      DEFAULT_AUTO_EXECUTE_DEBOUNCE_TIME
  );

  const handleChange = (event: Partial<ChangeEvent<HTMLInputElement>>) => {
    if (!form || !event.target) {
      return;
    }

    const { value } = event.target;
    const id = event.target.getAttribute("data-fieldid");
    if (!id) {
      return;
    }

    const type = event.target.getAttribute("data-fieldtype");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let newValue: any = value;
    if (type === FieldType.CHECKBOX) {
      newValue = event.target.checked;
    }

    setFieldResponses(
      produce((responses) => {
        // Important to set ID and Type so backend knows how to handle
        // saving these responses.
        responses[id] = {
          ...responses[id],
          field: { id, type } as Field,
          value: newValue,
        };
      })
    );

    if (autoExecuteAction) {
      debouncedAutoExecute(autoExecuteAction);
    }
  };

  const queryClient = useQueryClient();
  const saveFormMutation = useMutation({
    mutationFn: saveForm,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["form", data.slug],
      });
    },
  });

  const newDraftMutation = useMutation({
    mutationFn: newDraftForm,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["form", data.slug],
      });
    },
  });

  const deleteDraftMutation = useMutation({
    mutationFn: deleteForm,
    onSuccess: () => {
      setSearchParams((p) => {
        if (versions?.length === 1) {
          p.delete("language");
        }
        p.delete("v");
        return p;
      });
      setTimeout(
        () =>
          queryClient.invalidateQueries({
            queryKey: ["form", form.slug],
          }),
        100
      );
    },
  });

  const handleNewVersion = (language: Language) => {
    if (!published) return;

    if (!versions?.includes(0)) {
      newDraftMutation.mutate({ formId: form.id, languageId: language.id });
    }

    setSearchParams((p) => ({ ...p, v: 0, language: language.code }));
  };

  const handlePublish = () => {
    if (published) return;

    saveFormMutation.mutate({
      ...form,
      state: FormState.PUBLISHED,
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form) {
      return;
    }

    if (onSubmit) {
      try {
        await onSubmit(event, {
          id: submission?.id,
          form: {
            id: form.id,
          },
          fieldResponses: Object.values(fieldResponses),
        });
      } catch (e) {
        setError(`${e}`);
      }

      if (
        autoExecuteAction &&
        autoExecuteAction.autoExecuteLoading === undefined
      ) {
        setTimeout(() => setAutoExecuteLoading(false), AUTO_EXECUTE_LOADING_MS);
      }
    }
  };

  const handleEditMetadata = () => {
    formsDispatch({ type: "SET_METADATA_SLIDER_OPEN", payload: true });
  };

  const handleEditField = (field?: Partial<Field>) => {
    formsDispatch({ type: "SET_ACTIVE_FIELD", payload: field });
    formsDispatch({ type: "SET_EDIT_FIELD_SLIDER_OPEN", payload: true });
  };

  const handleEditFieldGroup = (fieldGroup?: Partial<FieldGroupEntity>) => {
    formsDispatch({ type: "SET_ACTIVE_FIELD_GROUP", payload: fieldGroup });
    formsDispatch({ type: "SET_EDIT_FIELD_GROUP_SLIDER_OPEN", payload: true });
  };

  return (
    <>
      {form && !isLoading ? (
        <form onSubmit={handleSubmit} className={classNames(background)}>
          {(isBuilding || isPreviewing) && (
            <div
              className={classNames(
                "sticky top-0 border-b border-gray-200 py-5 flex gap-3 flex-col sm:flex-row sm:items-center sm:justify-between",
                background
              )}
            >
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPreviewing(!isPreviewing)}
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isPreviewing ? "Exit Preview" : "Preview"}
                </button>
              </div>
              <div className="flex gap-3">
                <span className="text-sm inline-flex items-center font-bold">
                  {form.language
                    ? `${form.language.name} (${form.language.code})`
                    : "English (en)"}
                </span>
                {languages && (
                  <Dropdown
                    value="Languages"
                    disabled={!!submission}
                    actions={[
                      ...languages.map((l) => ({
                        id: l.id,
                        value: (
                          <span
                            className={
                              form.language?.id === l.id ? "font-bold" : ""
                            }
                          >
                            {l.name} ({l.code})
                          </span>
                        ),
                        disabled: !!submission || l.id === form.language?.id,
                        action: () =>
                          setSearchParams((p) => ({
                            ...p,
                            language: l?.code ?? "",
                          })),
                      })),
                      {
                        id: "new",
                        value: "+ Add Language",
                        action: () => setSelectLanguageSliderOpen(true),
                      },
                    ]}
                  />
                )}
                {!published && (
                  <button
                    type="button"
                    onClick={() => deleteDraftMutation.mutate(form.id)}
                    disabled={
                      form.language?.code === "en" && versions?.length === 1
                    }
                    className="inline-flex items-center rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-400 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <TrashIcon
                      className="-ml-0.5 mr-1.5 h-4 w-4"
                      aria-hidden="true"
                    />
                    Delete Draft
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handlePublish()}
                  disabled={published}
                  className="inline-flex items-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600 disabled:opacity-90 disabled:pointer-events-none"
                >
                  {published ? (
                    <>
                      <CheckIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                      Published
                      <PillBadge
                        className="ml-2"
                        color="indigo"
                        displayValue={`v${form.version}`}
                      />
                    </>
                  ) : (
                    "Publish"
                  )}
                </button>
                {versions && (
                  <Dropdown
                    value="Versions"
                    actions={[
                      ...versions.map((v) => ({
                        id: `v${v}`,
                        value: v ? (
                          <PillBadge color="indigo" displayValue={`v${v}`} />
                        ) : (
                          <PillBadge color="gray" displayValue={<i>Draft</i>} />
                        ),
                        action: () =>
                          setSearchParams((p) => ({
                            ...p,
                            v,
                            language: form.language?.code,
                          })),
                      })),
                      {
                        id: "new",
                        value: published
                          ? versions?.includes(0)
                            ? "Go to Draft"
                            : "+ New Version"
                          : "Save Draft",
                        action: () =>
                          published
                            ? handleNewVersion(form.language!)
                            : saveFormMutation.mutate(form),
                      },
                    ]}
                  />
                )}
              </div>
            </div>
          )}
          <div className="space-y-12">
            <div className="py-4">
              <div className="flex w-full justify-end mb-4">
                <div className="flex gap-3">
                  {languages && languages.length > 1 && (
                    <span className="text-sm inline-flex items-center font-bold">
                      {form.language ? form.language.nativeName : "English"}
                    </span>
                  )}
                  {!submission &&
                    languages &&
                    languages.length > 1 &&
                    setLanguage && (
                      <Dropdown
                        value="Languages"
                        actions={[
                          ...languages.map((l) => ({
                            id: l.id,
                            value: (
                              <span
                                className={
                                  form.language?.id === l.id ? "font-bold" : ""
                                }
                              >
                                {l.nativeName} ({l.name})
                              </span>
                            ),
                            disabled: l.id === form.language?.id,
                            action: () => setLanguage(l),
                          })),
                        ]}
                      />
                    )}
                </div>
              </div>
              {form.title ? (
                <h1
                  className="text-2xl font-semibold leading-7 text-gray-900"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml:
                  dangerouslySetInnerHTML={{ __html: form.title }}
                />
              ) : (
                isBuilding && (
                  <h1 className="italic text-2xl leading-7 text-gray-900">
                    Untitled Form
                  </h1>
                )
              )}
              {form.subtitle && (
                <h3
                  className="text-base font-semibold leading-7 text-gray-600"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml:
                  dangerouslySetInnerHTML={{ __html: form.subtitle }}
                />
              )}
              {form.description && (
                <p
                  className="mt-1 text-sm leading-6 text-gray-600"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml:
                  dangerouslySetInnerHTML={{ __html: form.description }}
                />
              )}

              {isBuilding && (
                <button
                  type="button"
                  onClick={handleEditMetadata}
                  className="text-secondary-600 hover:text-secondary-900"
                >
                  Edit
                </button>
              )}

              {/* FIELDS WITHOUT GROUPS */}
              {form.fields && form.fields.length > 0 && (
                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                  {noMutateSort(form.fields, orderSort)?.map((field) => (
                    <FormField
                      key={field.id}
                      field={field}
                      value={fieldResponses[field.id]?.value ?? ""}
                      loadedValue={fieldResponses[field.id]?.loadedValue}
                      readOnly={readOnly}
                      onChange={handleChange}
                      onEdit={
                        isBuilding
                          ? () =>
                              handleEditField({
                                ...field,
                                form: form as FormEntity,
                              })
                          : undefined
                      }
                      mediaUploadUrl={mediaUploadUrl}
                    />
                  ))}
                </div>
              )}
              {isBuilding && (
                <div className="mt-10">
                  {!form.fields?.length ? (
                    <AddNew
                      contentName="field"
                      pluralContentName="fields"
                      onAdd={() =>
                        handleEditField({
                          form: form as FormEntity,
                        })
                      }
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        handleEditField({
                          form: form as FormEntity,
                        })
                      }
                      className="block self-start w-max rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
                    >
                      + Add Field
                    </button>
                  )}
                </div>
              )}
            </div>

            {collapsedSteps && fieldGroups && (
              <Steps
                steps={fieldGroups.map((g, idx) => ({
                  name: (
                    <span
                      // biome-ignore lint/security/noDangerouslySetInnerHtml:
                      dangerouslySetInnerHTML={{
                        __html: g.title ?? `Step ${idx + 1}`,
                      }}
                    />
                  ),
                  description: (
                    <span
                      // biome-ignore lint/security/noDangerouslySetInnerHtml:
                      dangerouslySetInnerHTML={{
                        __html: g.subtitle ?? g.description ?? "",
                      }}
                    />
                  ),
                  onClick: () => setCurrentGroupIdx(idx),
                }))}
                currentIdx={currentGroupIdx}
              >
                <FieldGroup
                  group={fieldGroups[currentGroupIdx]}
                  hideTitle={true}
                  isBuilding={isBuilding}
                  onFieldChange={handleChange}
                  fieldResponses={fieldResponses}
                  readOnly={readOnly}
                  mediaUploadUrl={mediaUploadUrl}
                />
              </Steps>
            )}

            {/* GROUPED FIELDS */}
            {!collapsedSteps &&
              fieldGroups?.map((group, idx) => (
                <FieldGroup
                  key={group.id}
                  group={group}
                  isBuilding={isBuilding}
                  onFieldChange={handleChange}
                  fieldResponses={fieldResponses}
                  readOnly={readOnly}
                  className={classNames(
                    idx !== fieldGroups.length + 1
                      ? "border-b border-gray-900/10"
                      : ""
                  )}
                  mediaUploadUrl={mediaUploadUrl}
                />
              ))}

            {isBuilding &&
              (!fieldGroups?.length ? (
                <AddNew
                  contentName="field group"
                  pluralContentName="field groups"
                  onAdd={() =>
                    handleEditFieldGroup({
                      form: form as FormEntity,
                    })
                  }
                />
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    handleEditFieldGroup({
                      form: form as FormEntity,
                    })
                  }
                  className="block self-start w-max rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
                >
                  + Add Field Group
                </button>
              ))}
          </div>

          {/* SUBMIT */}
          {!isBuilding && !readOnly && (
            <div
              className={classNames(
                "sticky z-20 bottom-0 border-t border-gray-900/10 py-5 mt-6 flex items-center justify-end gap-x-6",
                background
              )}
            >
              {noMutateSort(formActions, orderSort)?.map((action) => (
                <button
                  key={action.id}
                  type={action.type}
                  onClick={action.type === "button" ? action.action : () => {}}
                  ref={action.ref}
                  className={classNames(
                    action.className ??
                      "rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600 transition-all",
                    action.autoExecute ? "opacity-80 pointer-events-none" : "",
                    action.autoExecute && autoExecuteLoading
                      ? "animate-pulse"
                      : ""
                  )}
                >
                  {action.autoExecute && autoExecuteLoading
                    ? action.autoExecuteProgressText ?? "Auto-saving..."
                    : action.value}
                </button>
              ))}
            </div>
          )}
        </form>
      ) : (
        <div className="w-full">
          <div className="animate-pulse flex-1">
            <div className="h-6 bg-slate-200 rounded" />
            <div className="h-64 bg-slate-200 rounded mt-3" />
            <div className="h-6 bg-slate-200 rounded mt-6" />
            <div className="h-64 bg-slate-200 rounded mt-3" />
            <div className="h-6 bg-slate-200 rounded mt-6" />
            <div className="h-64 bg-slate-200 rounded mt-3" />
          </div>
        </div>
      )}
      <SlideOver
        open={selectLanguageSliderOpen}
        setOpen={setSelectLanguageSliderOpen}
      >
        <SelectLanguage
          setOpen={setSelectLanguageSliderOpen}
          setLanguage={(language) => handleNewVersion(language)}
        />
      </SlideOver>
    </>
  );
};

export default Form;

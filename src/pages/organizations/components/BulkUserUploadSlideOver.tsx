import {
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  MinusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { useQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import Fuse from "fuse.js";
import Papa from "papaparse";
import {
  ChangeEvent,
  ComponentProps,
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Controller, useForm } from "react-hook-form";
import { useImmer } from "use-immer";
import { useMap } from "usehooks-ts";
import FormField from "../../../components/forms/FormField";
import Input from "../../../components/forms/inputs/Input";
import Select from "../../../components/forms/inputs/Select";
import InformationButton from "../../../components/layouts/buttons/InformationButton";
import Modal from "../../../components/layouts/modal/Modal";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import SlideOverForm from "../../../components/layouts/slide-over/SlideOverForm";
import SlideOverFormActionButtons from "../../../components/layouts/slide-over/SlideOverFormActionButtons";
import SlideOverHeading from "../../../components/layouts/slide-over/SlideOverHeading";
import {
  Step,
  StepBackwardButton,
  StepForwardButton,
  Steps2,
} from "../../../components/layouts/Steps2";
import VirtualizedTable from "../../../components/layouts/tables/VirtualizedTable";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";
import { useOpenData } from "../../../hooks/use-open-data";
import { saveOrganizationUser } from "../../../queries/organizations";
import { getTrainingAudiences } from "../../../queries/training";
import { Audience, Unit } from "../../../types/entities";
import { cn, extractErrorMessage, humanizeSlug } from "../../../utils/core";

interface OpenCloseProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface Props extends OpenCloseProps {}

interface UploadState {
  allWaiting: boolean;
  inProgress: boolean;
  finished: boolean;
  hasErrors: boolean;
  hasCancelled: boolean;
  errors: string[];
}

const BulkUserUploadContext = createContext<
  | (OpenCloseProps & {
      editUser: ReturnType<typeof useOpenData<number>>;
      displayErrors: ReturnType<typeof useOpenData<string[]>>;
      isUnitContext: boolean;
      allUnits: Unit[] | null | undefined;
      allAudiences: Audience[] | null | undefined;
      defaultUnit: Unit | null;
      defaultAudience: Audience | null;
      setDefaultUnit: (unit: Unit | null) => void;
      setDefaultAudience: (audience: Audience | null) => void;
      findUnit: (search: string) => Unit | null;
      findAudience: (search: string) => Audience | null;
      usersToUpload: PreparedUserRow[];
      setUsersToUpload: ReturnType<typeof useImmer<PreparedUserRow[]>>[1];
      userDataErrors: string[];
      userUploadProgress: ReturnType<
        typeof useMap<string, UserUploadProgress>
      >[0];
      setUserUploadProgress: ReturnType<
        typeof useMap<string, UserUploadProgress>
      >[1]["set"];
      uploadState: UploadState;
      csvFile: File | null;
      setCsvFile: (file: File | null) => void;
      rawCsvHeaders: string[] | null;
      setRawCsvHeaders: (headers: string[] | null) => void;
      headerMappings: ReturnType<typeof useMap<string, keyof UserCsvRow>>[0];
      setHeaderMapping: ReturnType<
        typeof useMap<string, keyof UserCsvRow>
      >[1]["set"];
      setHeaderMappings: ReturnType<
        typeof useMap<string, keyof UserCsvRow>
      >[1]["setAll"];
      reversedHeaderMappings: Map<keyof UserCsvRow, string>;
    })
  | null
>(null);

const useBulkUserUploadContext = () => {
  const context = useContext(BulkUserUploadContext);
  if (!context) {
    throw new Error(
      "useBulkUserUploadContext must be used within a BulkUserUploadContextProvider"
    );
  }
  return context;
};

function BulkUserUploadContextProvider({
  open,
  setOpen,
  editUser,
  displayErrors,
  children,
}: PropsWithChildren<
  OpenCloseProps & {
    editUser: ReturnType<typeof useOpenData<number>>;
    displayErrors: ReturnType<typeof useOpenData<string[]>>;
  }
>) {
  const { isUnitContext, allUnits, currentOrganization, currentUnit } =
    useContext(OrganizationsContext);

  const { data: allAudiences } = useQuery({
    queryKey: [
      "training-audiences",
      "for-organization-id",
      currentOrganization?.id,
    ] as const,
    queryFn: () =>
      getTrainingAudiences({ limit: 100 }).then((r) =>
        r.results.filter(
          (a) => !!currentOrganization?.allowedAudiences.includes(a.slug)
        )
      ),
  });

  const [defaultUnit, setDefaultUnit] = useState<Unit | null>(null);
  useEffect(() => {
    if (isUnitContext && currentUnit) {
      setDefaultUnit(currentUnit);
    }
  }, [isUnitContext, currentUnit]);

  const [defaultAudience, setDefaultAudience] = useState<Audience | null>(null);

  const unitsFuse = useMemo(
    () =>
      allUnits
        ? new Fuse(allUnits, {
            keys: ["name", "slug"],
            threshold: 0.2,
          })
        : null,
    [allUnits]
  );
  const findUnit = useCallback(
    (search: string) => {
      if (!unitsFuse) return null;
      return unitsFuse.search(search).at(0)?.item ?? null;
    },
    [unitsFuse]
  );

  const audiencesFuse = useMemo(
    () =>
      allAudiences
        ? new Fuse(allAudiences, {
            keys: ["slug"],
            threshold: 0.2,
          })
        : null,
    [allAudiences]
  );
  const findAudience = useCallback(
    (search: string) => {
      if (!audiencesFuse) return null;
      return audiencesFuse.search(search).at(0)?.item ?? null;
    },
    [audiencesFuse]
  );

  const [file, setFile] = useState<File | null>(null);
  const [rawCsvHeaders, setRawCsvHeaders] = useState<string[] | null>(null);
  const [headerMappings, { set: setHeaderMapping, setAll: setHeaderMappings }] =
    useMap<string, keyof UserCsvRow>();
  const reversedHeaderMappings = useMemo(
    () => new Map(Array.from(headerMappings.entries()).map(([k, v]) => [v, k])),
    [headerMappings]
  );

  const [usersToUpload, setUsersToUpload] = useImmer<PreparedUserRow[]>([]);
  const userDataErrors = useMemo(() => {
    const errors: string[] = [];
    const emails = new Set<string>();

    usersToUpload.forEach((user, index) => {
      if (!user.email) {
        errors.push(`Email is required for row ${index + 1}.`);
        return;
      }

      if (!user.firstName) {
        errors.push(`First name is required for ${user.email}.`);
      }

      if (!user.lastName) {
        errors.push(`Last name is required for ${user.email}.`);
      }

      if (emails.has(user.email)) {
        errors.push(`Duplicate email: ${user.email}`);
      } else {
        emails.add(user.email);
      }

      if (!user.unit) {
        errors.push(`Unit is required for ${user.email}.`);
      }
    });

    return errors;
  }, [usersToUpload]);

  const [userUploadProgress, { set: setUserUploadProgress }] = useMap<
    string,
    UserUploadProgress
  >();

  const uploadState = useMemo(() => {
    const statuses = Array.from(userUploadProgress.values());
    return {
      allWaiting:
        statuses.length === 0 || statuses.every((p) => p.status === "waiting"),
      inProgress:
        statuses.length > 0 && statuses.some((p) => p.status === "uploading"),
      finished:
        statuses.length === usersToUpload.length &&
        statuses.every((p) =>
          ["success", "error", "cancelled"].includes(p.status)
        ),
      hasErrors:
        statuses.length > 0 && statuses.some((p) => p.status === "error"),
      hasCancelled:
        statuses.length > 0 && statuses.some((p) => p.status === "cancelled"),
      errors: statuses
        .filter(
          (p): p is UserUploadProgress & { error: string } =>
            p.status === "error" && !!p.error
        )
        .map((p) => p.error),
    } satisfies UploadState;
  }, [userUploadProgress, usersToUpload]);

  return (
    <BulkUserUploadContext.Provider
      value={{
        open,
        setOpen,
        editUser,
        displayErrors,
        isUnitContext,
        allUnits,
        allAudiences,
        defaultUnit,
        setDefaultUnit,
        defaultAudience,
        setDefaultAudience,
        findUnit,
        findAudience,
        usersToUpload,
        setUsersToUpload,
        userDataErrors,
        userUploadProgress,
        setUserUploadProgress,
        uploadState,
        csvFile: file,
        setCsvFile: setFile,
        rawCsvHeaders,
        setRawCsvHeaders,
        headerMappings,
        setHeaderMapping,
        setHeaderMappings,
        reversedHeaderMappings,
      }}
    >
      {children}
    </BulkUserUploadContext.Provider>
  );
}

export default function BulkUserUploadSlideOver({ open, setOpen }: Props) {
  const editUser = useOpenData<number>();
  const displayErrors = useOpenData<string[]>();

  return (
    <SlideOver open={open} setOpen={setOpen}>
      <BulkUserUploadContextProvider
        open={open}
        setOpen={setOpen}
        editUser={editUser}
        displayErrors={displayErrors}
      >
        <BulkUserUploadForm />
        <Modal open={editUser.open} setOpen={editUser.setOpen}>
          <EditUserForm />
        </Modal>
        <Modal open={displayErrors.open} setOpen={displayErrors.setOpen}>
          <DisplayErrorStrings
            errors={displayErrors.data ?? []}
            onClose={displayErrors.close}
          />
        </Modal>
      </BulkUserUploadContextProvider>
    </SlideOver>
  );
}

function BulkUserUploadForm() {
  const { isUnitContext, currentOrganization, currentUnit } =
    useContext(OrganizationsContext);
  const { setOpen } = useBulkUserUploadContext();

  return (
    <>
      <SlideOverForm
        onSubmit={(e) => e.preventDefault()}
        onClose={() => setOpen(false)}
        readOnly
        closeText="Close"
      >
        <SlideOverHeading
          title={`Add users to ${
            isUnitContext
              ? currentUnit?.name ?? "unit"
              : currentOrganization?.name ?? "organization"
          }`}
          description={`Use this tool to add users from a CSV file to ${
            isUnitContext ? "this unit" : "this organization"
          }.`}
          setOpen={setOpen}
        />
        <div className="flex flex-col gap-4 p-4 h-full">
          <Steps2>
            <Step1UploadCsvFile />
            <Step2MatchColumnNames />
            <Step3ReviewAndUpload />
          </Steps2>
        </div>
      </SlideOverForm>
    </>
  );
}

function Step1UploadCsvFile(props: Partial<ComponentProps<typeof Step>>) {
  const { setRawCsvHeaders, setHeaderMappings, setCsvFile, rawCsvHeaders } =
    useBulkUserUploadContext();

  const extractCsvHeaders = (file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      preview: 1,
      complete: (results) => {
        const rawHeaders = Object.keys(results.data[0]);
        setRawCsvHeaders(rawHeaders);
        setHeaderMappings(
          rawHeaders
            .map(normalizeHeader)
            .map((h) => [h, CSV_HEADERS_MAPPER.get(h)])
            .filter((v): v is [string, keyof UserCsvRow] => !!v[1])
        );
      },
    });
  };

  const handleCsvUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setCsvFile(file);
    extractCsvHeaders(file);
  };

  return (
    <Step
      {...props}
      name="Step 1: Select CSV File to Upload"
      canProceed={!!rawCsvHeaders}
    >
      <Input
        type="file"
        name="file"
        accept=".csv"
        className="pl-2 w-full"
        onChange={handleCsvUpload}
      />
      <div className="flex justify-end mt-10">
        <StepForwardButton>Next</StepForwardButton>
      </div>
    </Step>
  );
}

function Step2MatchColumnNames(props: Partial<ComponentProps<typeof Step>>) {
  const {
    isUnitContext,
    defaultUnit,
    setDefaultUnit,
    allUnits,
    allAudiences,
    defaultAudience,
    setDefaultAudience,
    findUnit,
    findAudience,
    csvFile,
    rawCsvHeaders,
    headerMappings,
    setHeaderMapping,
    reversedHeaderMappings,
    setUsersToUpload,
  } = useBulkUserUploadContext();

  const userFields = useMemo(
    () => USER_FIELDS.filter((f) => !isUnitContext || f.name !== "unit"),
    [isUnitContext]
  );

  const allFieldsSatisfied = useMemo(
    () =>
      userFields.every(
        (f) =>
          !f.required ||
          !!reversedHeaderMappings.get(f.name) ||
          (f.name === "unit" && !!defaultUnit)
      ),
    [reversedHeaderMappings, userFields, defaultUnit]
  );

  useEffect(() => {
    if (allFieldsSatisfied && csvFile && allUnits && allAudiences) {
      Papa.parse<PreparedUserRow>(csvFile, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => headerMappings.get(normalizeHeader(h)) ?? h,
        transform: (v, h) => {
          if (h === "unit") {
            return isUnitContext ? defaultUnit : findUnit(v) ?? defaultUnit;
          }
          if (h === "trainingGroup") {
            return findAudience(v) ?? defaultAudience;
          }
          if (h === "email") {
            return v.toLowerCase();
          }
          return v;
        },
        complete: (results) => {
          setUsersToUpload(
            results.data.map((row) => {
              if (!row.unit && defaultUnit) {
                row.unit = defaultUnit;
              }

              if (!row.trainingGroup && defaultAudience) {
                row.trainingGroup = defaultAudience;
              }

              return row;
            })
          );
        },
      });
    }
  }, [
    allFieldsSatisfied,
    headerMappings,
    findUnit,
    findAudience,
    allUnits,
    allAudiences,
    setUsersToUpload,
    defaultUnit,
    defaultAudience,
    csvFile,
    isUnitContext,
  ]);

  return (
    <Step
      {...props}
      name="Step 2: Match Column Names"
      description="Select the column names in the CSV file that match the user fields in the table below."
      canProceed={allFieldsSatisfied}
    >
      <div className="grid grid-cols-[130px_50px_1fr_1fr_50px] divide-y divide-y-gray-200 w-full">
        <div className="text-sm font-semibold col-span-full grid grid-cols-subgrid">
          <div>User Field</div>
          <div></div>
          <div>CSV Header</div>
          <div className="inline-flex items-center gap-1">
            Default
            <InformationButton text="Default value if corresponding value in CSV is missing or blank." />
          </div>
          <div></div>
        </div>
        {USER_FIELDS.filter((f) => !isUnitContext || f.name !== "unit").map(
          (userField) => {
            const selectedHeader = reversedHeaderMappings.get(userField.name);
            return (
              <div
                key={userField.name}
                className="col-span-full grid grid-cols-subgrid gap-x-6 py-2 items-center w-full"
              >
                <div className="text-sm font-regular shrink-0">
                  {userField.label}
                </div>
                <ArrowRightIcon className="size-4 shrink-0" />
                <Select
                  value={selectedHeader}
                  onChange={(e) =>
                    setHeaderMapping(e.target.value, userField.name)
                  }
                  options={(rawCsvHeaders ?? []).map((h) => ({
                    label: h,
                    key: normalizeHeader(h),
                  }))}
                  showClear
                  clearButtonPosition="right"
                  className="shrink-0"
                />
                <div className="shrink-0">
                  {userField.name === "unit" ? (
                    <Select
                      value={defaultUnit?.id}
                      onChange={(e) =>
                        setDefaultUnit(
                          allUnits?.find((u) => u.id === e.target.value) ?? null
                        )
                      }
                      options={(allUnits ?? []).map((u) => ({
                        key: u.id,
                        label: u.name,
                      }))}
                      showClear
                      clearButtonPosition="right"
                    />
                  ) : userField.name === "trainingGroup" ? (
                    <Select
                      value={defaultAudience?.id}
                      onChange={(e) =>
                        setDefaultAudience(
                          allAudiences?.find((a) => a.id === e.target.value) ??
                            null
                        )
                      }
                      options={(allAudiences ?? []).map((s) => ({
                        key: s.id,
                        label: s.slug,
                      }))}
                      showClear
                      clearButtonPosition="right"
                    />
                  ) : (
                    <>&mdash;</>
                  )}
                </div>
                <div className="w-full flex items-center justify-center shrink-0">
                  {selectedHeader ||
                  (userField.name === "unit" && defaultUnit) ||
                  (userField.name === "trainingGroup" && defaultAudience) ? (
                    <CheckCircleIcon className="size-5 text-green-500" />
                  ) : userField.required ? (
                    <ExclamationCircleIcon
                      className="size-5 text-red-500"
                      title="Please select matching header."
                    />
                  ) : (
                    <ExclamationCircleIcon
                      className="size-5 text-gray-500"
                      title="(Optional) Please select matching header."
                    />
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>
      <div className="flex gap-4 mt-10">
        <StepBackwardButton>Back</StepBackwardButton>
        <StepForwardButton>Next</StepForwardButton>
      </div>
    </Step>
  );
}

function Step3ReviewAndUpload(props: Partial<ComponentProps<typeof Step>>) {
  const {
    isUnitContext,
    invalidateOrganizationUsersQuery,
    currentOrganization,
  } = useContext(OrganizationsContext);

  const {
    editUser,
    userDataErrors,
    usersToUpload,
    setUsersToUpload,
    userUploadProgress,
    displayErrors,
    uploadState,
    setUserUploadProgress,
  } = useBulkUserUploadContext();

  const cancelFlag = useRef(false);

  const handleUserUpload = useCallback(async () => {
    if (!currentOrganization) {
      return;
    }

    const doUpload = async (user: PreparedUserRow) => {
      return saveOrganizationUser(currentOrganization.id, {
        username: user.email,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        canAccessTraining: !!user.trainingGroup,
        attributes: {
          audience: user.trainingGroup ? [user.trainingGroup.slug] : [],
          ...(user.unit ? { unit: [user.unit.slug] } : {}),
        },
      });
    };

    const batchSize = 10;
    const iterations = Math.ceil(usersToUpload.length / batchSize);

    const readyUsers = usersToUpload.filter((u) => {
      const current = userUploadProgress.get(u.email);
      return !current || current.status !== "success";
    });

    for (let i = 0; i < iterations; i++) {
      const batch = readyUsers.slice(i * batchSize, (i + 1) * batchSize);

      if (cancelFlag.current) {
        batch.forEach((user) => {
          const current = userUploadProgress.get(user.email);
          if (!current || !["success, error"].includes(current.status)) {
            setUserUploadProgress(user.email, { status: "cancelled" });
          }
        });
        continue;
      }

      await Promise.allSettled(
        batch.map(async (user) => {
          setUserUploadProgress(user.email, { status: "uploading" });
          try {
            await doUpload(user);
            setUserUploadProgress(user.email, { status: "success" });
          } catch (e) {
            let errorMsg = `Some unknown error occurred: ${e}`;
            const errors = extractErrorMessage(e);
            if (errors) {
              if (Array.isArray(errors)) {
                errorMsg = errors.join(", ");
              } else {
                errorMsg = errors;
              }
            }
            setUserUploadProgress(user.email, {
              status: "error",
              error: errorMsg,
            });
          }
        })
      );
    }

    invalidateOrganizationUsersQuery();
  }, [
    currentOrganization,
    usersToUpload,
    invalidateOrganizationUsersQuery,
    setUserUploadProgress,
    userUploadProgress,
  ]);

  const usersTable = useReactTable({
    data: usersToUpload,
    columns: [
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex gap-2 items-center">
            <button
              type="button"
              className="enabled:cursor-pointer enabled:hover:opacity-75 text-red-500 disabled:opacity-50"
              onClick={() =>
                setUsersToUpload((draft) => {
                  draft.splice(row.index, 1);
                })
              }
              disabled={!uploadState.allWaiting}
            >
              <TrashIcon className="size-5" />
            </button>
            <button
              type="button"
              className="enabled:cursor-pointer enabled:hover:opacity-75 text-gray-500 disabled:opacity-50"
              onClick={() => editUser.openData(row.index)}
              disabled={!uploadState.allWaiting}
            >
              <PencilSquareIcon className="size-5" />
            </button>
          </div>
        ),
        size: 70,
      },
      {
        accessorKey: "email",
        header: "Email",
        size: 250,
        cell: ({ getValue }) => {
          const email = getValue();
          return userDataErrors.includes(`Duplicate email: ${email}`) ? (
            <div className="text-red-500 inline-flex items-center gap-1">
              <ExclamationCircleIcon className="size-4" />
              {email} (Duplicate)
            </div>
          ) : (
            <div className="overflow-hidden text-ellipsis">{email}</div>
          );
        },
      },
      {
        id: "uploadProgress",
        size: 50,
        cell: ({ row }) => {
          const progress = userUploadProgress.get(row.original.email);
          return progress && progress.status !== "waiting" ? (
            <>
              {progress.status === "uploading" ? (
                <ClockIcon className="size-5 text-secondary-500" />
              ) : progress.status === "success" ? (
                <CheckCircleIcon className="size-5 text-green-500" />
              ) : progress.status === "error" ? (
                <ExclamationCircleIcon
                  className="size-5 text-red-500"
                  title={progress.error}
                />
              ) : (
                <MinusCircleIcon className="size-5 text-gray-500" />
              )}
            </>
          ) : (
            <></>
          );
        },
      },
      {
        accessorKey: "firstName",
        header: "First Name",
        size: 125,
        cell: ({ getValue }) => (
          <div className="overflow-hidden text-ellipsis">{getValue()}</div>
        ),
      },
      {
        accessorKey: "lastName",
        header: "Last Name",
        size: 125,
        cell: ({ getValue }) => (
          <div className="overflow-hidden text-ellipsis">{getValue()}</div>
        ),
      },
      {
        id: "unit",
        accessorKey: "unit.name",
        header: "Unit",
        cell: ({ getValue, row }) => {
          const unitName = getValue();
          return unitName ? (
            <div className="overflow-hidden text-ellipsis">{getValue()}</div>
          ) : (
            <div className="text-red-500 text-xs inline-flex items-center gap-1">
              <ExclamationCircleIcon className="size-4" />
              Unit required -
              <button
                className="underline font-semibold cursor-pointer"
                onClick={() => editUser.openData(row.index)}
              >
                Fix
              </button>
            </div>
          );
        },
      },
      {
        accessorKey: "trainingGroup.slug",
        header: "Training Group",
        cell: ({ getValue }) => {
          const value = getValue();
          return (
            <div className="overflow-hidden text-ellipsis">
              {value ? humanizeSlug(value) : <>&mdash;</>}
            </div>
          );
        },
      },
    ],
    initialState: {
      columnVisibility: {
        unit: !isUnitContext,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Step {...props} name="Step 3: Review & Add">
      <VirtualizedTable table={usersTable} height="400px" />
      <div className="mt-4">
        {userDataErrors.length > 0 ? (
          <div className="text-sm text-red-500 inline-flex items-center gap-1">
            <ExclamationCircleIcon className="size-4" />
            There are <span className="font-bold">
              {userDataErrors.length}
            </span>{" "}
            errors. Please resolve them to finish uploading users.
            <button
              className="underline font-semibold cursor-pointer"
              type="button"
              onClick={() => {
                displayErrors.openData(userDataErrors);
              }}
            >
              View details.
            </button>
          </div>
        ) : uploadState.hasErrors ? (
          <div className="text-sm text-red-500 inline-flex items-center gap-1">
            <ExclamationCircleIcon className="size-4" />
            <span className="font-bold">{uploadState.errors.length}</span>{" "}
            occurred while uploading users.
            <button
              className="underline font-semibold cursor-pointer"
              type="button"
              onClick={() => {
                displayErrors.openData(uploadState.errors);
              }}
            >
              View details.
            </button>
          </div>
        ) : (
          <div className="text-sm text-green-500  inline-flex items-center gap-1">
            <CheckCircleIcon className="size-4" />
            No errors to resolve.
          </div>
        )}
      </div>
      <div className="flex gap-4 mt-10">
        <StepBackwardButton>Back</StepBackwardButton>
        <button
          type="button"
          className={cn(
            "inline-flex justify-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-secondary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-secondary-600 disabled:bg-secondary-400",
            uploadState.inProgress && "animate-pulse"
          )}
          disabled={userDataErrors.length > 0 || !uploadState.allWaiting}
          onClick={handleUserUpload}
        >
          {uploadState.inProgress
            ? "Processing..."
            : uploadState.finished
            ? uploadState.hasCancelled
              ? "Process cancelled"
              : "Users Added"
            : "Add Users"}
        </button>
        {uploadState.finished &&
          (uploadState.hasCancelled || uploadState.hasErrors) && (
            <button
              className="text-secondary-500 underline cursor-pointer text-sm"
              onClick={() => {
                cancelFlag.current = false;
                handleUserUpload();
              }}
            >
              Retry failed or cancelled
            </button>
          )}
        {uploadState.inProgress && (
          <button
            className="text-secondary-500 underline cursor-pointer text-sm"
            onClick={() => (cancelFlag.current = true)}
          >
            Cancel
          </button>
        )}
      </div>
    </Step>
  );
}

function EditUserForm() {
  const { editUser, usersToUpload, setUsersToUpload, allUnits, allAudiences } =
    useBulkUserUploadContext();

  const user = useMemo(
    () =>
      editUser.data !== null ? usersToUpload.at(editUser.data) : undefined,
    [usersToUpload, editUser.data]
  );

  const formMethods = useForm<PreparedUserRow>({
    values: user ?? {
      firstName: "",
      lastName: "",
      email: "",
      unit: null,
      trainingGroup: null,
    },
  });

  const onUpdate = (data: PreparedUserRow) => {
    setUsersToUpload((draft) => {
      if (editUser.data === null) return;
      draft.splice(editUser.data, 1, data);
    });
    editUser.close();
  };

  return (
    <div className="grid gap-4 p-8">
      <h2 className="text-lg font-semibold">Edit User</h2>
      <FormField
        field={{
          label: "First Name",
        }}
        {...formMethods.register("firstName")}
      />
      <FormField
        field={{
          label: "Last Name",
        }}
        {...formMethods.register("lastName")}
      />
      <FormField
        field={{
          label: "Email",
        }}
        {...formMethods.register("email")}
      />
      <FormField
        field={{
          label: "Unit",
        }}
        input={
          <Controller
            control={formMethods.control}
            name="unit"
            render={({ field }) => (
              <Select
                value={field.value?.id}
                onChange={(a) =>
                  field.onChange(allUnits?.find((u) => u.id === a.target.value))
                }
                options={(allUnits ?? []).map((u) => ({
                  key: u.id,
                  label: u.name,
                }))}
              />
            )}
          />
        }
      />
      <FormField
        field={{
          label: "Training Group",
        }}
        input={
          <Controller
            control={formMethods.control}
            name="trainingGroup"
            render={({ field }) => (
              <Select
                value={field.value?.id}
                onChange={(a) =>
                  field.onChange(
                    allAudiences?.find((u) => u.id === a.target.value)
                  )
                }
                options={(allAudiences ?? []).map((u) => ({
                  key: u.id,
                  label: humanizeSlug(u.slug),
                }))}
              />
            )}
          />
        }
      />
      <SlideOverFormActionButtons
        onClose={editUser.close}
        closeText="Cancel"
        submitText="Update"
        onDone={() => onUpdate(formMethods.getValues())}
        className="px-0 sm:px-0"
      />
    </div>
  );
}

function DisplayErrorStrings({
  errors,
  onClose,
}: {
  errors: string[];
  onClose: () => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: errors.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
  });

  return (
    <div className="grid gap-4 p-8">
      <h2 className="text-lg font-semibold">Errors Details</h2>
      <div className="grid gap-4 h-[400px] overflow-auto" ref={parentRef}>
        <div
          className="relative w-full"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const error = errors[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                className="absolute top-0 left-0 w-full flex items-center gap-2 text-red-500"
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <ExclamationCircleIcon className="size-5 text-red-500" />
                {error}
              </div>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onClose()}
        className="cursor-pointer rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 enabled:hover:bg-gray-50 disabled:opacity-70"
      >
        Close
      </button>
    </div>
  );
}

interface UserCsvRow {
  firstName: string;
  lastName: string;
  email: string;
  unit: string;
  trainingGroup?: string;
}

type PreparedUserRow = Omit<UserCsvRow, "unit" | "trainingGroup"> & {
  unit: Unit | null;
  trainingGroup: Audience | null;
};

interface UserUploadProgress {
  status: "waiting" | "uploading" | "success" | "error" | "cancelled";
  error?: string;
}

interface UserField<K extends keyof UserCsvRow> {
  name: K;
  label: string;
  type: "text" | "email";
  required: undefined extends UserCsvRow[K] ? false : true;
}

const USER_FIELDS = [
  {
    name: "firstName",
    label: "First Name",
    type: "text",
    required: true,
  } as UserField<"firstName">,
  {
    name: "lastName",
    label: "Last Name",
    type: "text",
    required: true,
  } as UserField<"lastName">,
  {
    name: "email",
    label: "Email",
    type: "email",
    required: true,
  } as UserField<"email">,
  {
    name: "unit",
    label: "Unit",
    type: "text",
    required: true,
  } as UserField<"unit">,
  {
    name: "trainingGroup",
    label: "Training Group",
    type: "text",
    required: false,
  } as UserField<"trainingGroup">,
];

const CSV_HEADERS_MAPPER = new Map<string, keyof UserCsvRow>([
  ["firstname", "firstName"],
  ["first", "firstName"],
  ["lastname", "lastName"],
  ["last", "lastName"],
  ["email", "email"],
  ["givenname", "firstName"],
  ["familyname", "lastName"],
  ["emailaddress", "email"],
  ["surname", "lastName"],
  ["unit", "unit"],
  ["unitslug", "unit"],
  ["school", "unit"],
  ["site", "unit"],
  ["location", "unit"],
  ["traininggroup", "trainingGroup"],
  ["traininggroupname", "trainingGroup"],
  ["audience", "trainingGroup"],
  ["group", "trainingGroup"],
  ["groupname", "trainingGroup"],
]);

const normalizeHeader = (h: string) =>
  h.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

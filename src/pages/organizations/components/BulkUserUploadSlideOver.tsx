import {
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { useQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Fuse from "fuse.js";
import Papa from "papaparse";
import {
  ChangeEvent,
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
import { getTrainingAudiences } from "../../../queries/training";
import { Audience, Unit } from "../../../types/entities";
import { humanizeSlug } from "../../../utils/core";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function BulkUserUploadSlideOver({ open, setOpen }: Props) {
  const { isUnitContext, allUnits } = useContext(OrganizationsContext);

  const { data: audiences } = useQuery({
    queryKey: ["training-audiences"],
    queryFn: () => getTrainingAudiences({ limit: 100 }).then((r) => r.results),
  });

  const [file, setFile] = useState<File | null>(null);
  const [rawCsvHeaders, setRawCsvHeaders] = useState<string[] | null>(null);
  const [headerMappings, { set: setHeaderMapping, setAll: setHeaderMappings }] =
    useMap<string, keyof UserCsvRow>();
  const reversedHeaderMappings = useMemo(
    () => new Map(Array.from(headerMappings.entries()).map(([k, v]) => [v, k])),
    [headerMappings]
  );

  const editUser = useOpenData<number>();

  const [usersToUpload, setUsersToUpload] = useImmer<PreparedUserRow[]>([]);
  const userdataErrors = useMemo(() => {
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

  const opened = useRef(false);
  useEffect(() => {
    if (opened && !open) {
      setRawCsvHeaders(null);
    }
    if (open) {
      opened.current = true;
    }
  }, [open]);

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
      audiences
        ? new Fuse(audiences, {
            keys: ["slug"],
            threshold: 0.2,
          })
        : null,
    [audiences]
  );
  const findAudience = useCallback(
    (search: string) => {
      if (!audiencesFuse) return null;
      return audiencesFuse.search(search).at(0)?.item ?? null;
    },
    [audiencesFuse]
  );

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

    setFile(file);
    extractCsvHeaders(file);
  };

  const userFields = useMemo(
    () => USER_FIELDS.filter((f) => !isUnitContext || f.name !== "unit"),
    [isUnitContext]
  );

  const allFieldsSatisfied = useMemo(
    () =>
      userFields.every(
        (f) => !f.required || !!reversedHeaderMappings.get(f.name)
      ),
    [reversedHeaderMappings, userFields]
  );

  useEffect(() => {
    if (allFieldsSatisfied && file && allUnits && audiences) {
      Papa.parse<PreparedUserRow>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => headerMappings.get(normalizeHeader(h)) ?? h,
        transform: (v, h) => {
          if (h === "unit") {
            return findUnit(v);
          }
          if (h === "trainingGroup") {
            return findAudience(v);
          }
          return v;
        },
        complete: (results) => {
          setUsersToUpload(results.data);
        },
      });
    }
  }, [
    allFieldsSatisfied,
    file,
    headerMappings,
    findUnit,
    findAudience,
    allUnits,
    audiences,
    setUsersToUpload,
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
              className="cursor-pointer enabled:hover:opacity-75"
              onClick={() =>
                setUsersToUpload((draft) => {
                  draft.splice(row.index, 1);
                })
              }
            >
              <TrashIcon className="size-5 text-red-500" />
            </button>
            <button
              type="button"
              className="cursor-pointer enabled:hover:opacity-75"
              onClick={() => editUser.openData(row.index)}
            >
              <PencilSquareIcon className="size-5 text-gray-500" />
            </button>
          </div>
        ),
        size: 70,
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
        accessorKey: "email",
        header: "Email",
        size: 250,
        cell: ({ getValue }) => (
          <div className="overflow-hidden text-ellipsis">{getValue()}</div>
        ),
      },
      {
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
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  return (
    <>
      <SlideOver open={open} setOpen={setOpen}>
        <SlideOverForm
          onSubmit={(e) => e.preventDefault()}
          onClose={() => setOpen(false)}
        >
          <SlideOverHeading
            title="Upload Users CSV"
            description={
              "Use this tool to upload users in bulk from a CSV file."
            }
            setOpen={setOpen}
          />
          <div className="flex flex-col gap-4 p-4 h-full">
            <Steps2>
              <Step
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
              <Step
                name="Step 2: Match Column Names"
                description="Select the column names in the CSV file that match the user fields in the table below."
                canProceed={allFieldsSatisfied}
              >
                <div className="grid grid-cols-4 divide-y divide-y-gray-200">
                  <div className="text-sm font-semibold col-span-full grid grid-cols-subgrid">
                    <div>User Field</div>
                    <div></div>
                    <div>CSV Header</div>
                    <div></div>
                  </div>
                  {USER_FIELDS.filter(
                    (f) => !isUnitContext || f.name !== "unit"
                  ).map((userField) => {
                    const selectedHeader = reversedHeaderMappings.get(
                      userField.name
                    );
                    return (
                      <div
                        key={userField.name}
                        className="col-span-full grid grid-cols-subgrid py-2 items-center"
                      >
                        <div className="text-sm font-regular">
                          {userField.label}
                        </div>
                        <ArrowRightIcon className="size-4" />
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
                        />
                        <div className="w-full flex items-center justify-center">
                          {selectedHeader ? (
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
                  })}
                </div>
                <div className="flex gap-4 mt-10">
                  <StepBackwardButton>Back</StepBackwardButton>
                  <StepForwardButton>Next</StepForwardButton>
                </div>
              </Step>
              <Step name="Step 3: Review & Upload">
                <VirtualizedTable table={usersTable} height="400px" />
                {userdataErrors.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm text-red-500 inline-flex items-center gap-1">
                      <ExclamationCircleIcon className="size-4" />
                      There are{" "}
                      <span className="font-bold">
                        {userdataErrors.length}
                      </span>{" "}
                      errors. Please resolve them to finish uploading users.
                      <button
                        className="underline font-semibold cursor-pointer"
                        type="button"
                      >
                        View details.
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex gap-4 mt-10">
                  <StepBackwardButton>Back</StepBackwardButton>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-secondary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600 disabled:bg-secondary-400"
                    disabled={userdataErrors.length > 0}
                  >
                    Upload
                  </button>
                </div>
              </Step>
            </Steps2>
          </div>
        </SlideOverForm>
      </SlideOver>
      <Modal open={editUser.open} setOpen={editUser.setOpen}>
        {editUser.data !== null ? (
          <EditUserForm
            user={usersToUpload.at(editUser.data)}
            allUnits={allUnits}
            audiences={audiences}
            onClose={editUser.close}
            onUpdate={(data) => {
              setUsersToUpload((draft) => {
                if (editUser.data === null) return;
                draft.splice(editUser.data, 1, data);
              });
              editUser.close();
            }}
          />
        ) : (
          <></>
        )}
      </Modal>
    </>
  );
}

function EditUserForm({
  user,
  allUnits,
  audiences,
  onClose,
  onUpdate,
}: {
  user: PreparedUserRow | undefined;
  allUnits: Unit[] | undefined | null;
  audiences: Audience[] | undefined | null;
  onClose: () => void;
  onUpdate: (data: PreparedUserRow) => void;
}) {
  const formMethods = useForm<PreparedUserRow>({
    values: user ?? {
      firstName: "",
      lastName: "",
      email: "",
      unit: null,
      trainingGroup: null,
    },
  });

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
                    audiences?.find((u) => u.id === a.target.value)
                  )
                }
                options={(audiences ?? []).map((u) => ({
                  key: u.id,
                  label: humanizeSlug(u.slug),
                }))}
              />
            )}
          />
        }
      />
      <SlideOverFormActionButtons
        onClose={onClose}
        closeText="Cancel"
        submitText="Update"
        onDone={() => onUpdate(formMethods.getValues())}
        className="px-0 sm:px-0"
      />
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
  ["lastname", "lastName"],
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

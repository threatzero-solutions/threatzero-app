import {
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/20/solid";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Papa from "papaparse";
import {
  ChangeEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMap } from "usehooks-ts";
import Input from "../../../components/forms/inputs/Input";
import Select from "../../../components/forms/inputs/Select";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import SlideOverForm from "../../../components/layouts/slide-over/SlideOverForm";
import SlideOverHeading from "../../../components/layouts/slide-over/SlideOverHeading";
import {
  Step,
  StepBackwardButton,
  StepForwardButton,
  Steps2,
} from "../../../components/layouts/Steps2";
import VirtualizedTable from "../../../components/layouts/tables/VirtualizedTable";
import { OrganizationsContext } from "../../../contexts/organizations/organizations-context";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function BulkUserUploadSlideOver({ open, setOpen }: Props) {
  const { isUnitContext } = useContext(OrganizationsContext);

  const [file, setFile] = useState<File | null>(null);
  const [rawCsvHeaders, setRawCsvHeaders] = useState<string[] | null>(null);
  const [headerMappings, { set: setHeaderMapping, setAll: setHeaderMappings }] =
    useMap<keyof UserCsvRow, string>();

  const [usersToUpload, setUsersToUpload] = useState<UserCsvRow[]>([]);

  const opened = useRef(false);
  useEffect(() => {
    if (opened && !open) {
      setRawCsvHeaders(null);
    }
    if (open) {
      opened.current = true;
    }
  }, [open]);

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
            .map((h) => [CSV_HEADERS_MAPPER.get(h), h])
            .filter((v): v is [keyof UserCsvRow, string] => !!v[0])
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
    () => userFields.every((f) => !f.required || !!headerMappings.get(f.name)),
    [headerMappings, userFields]
  );

  useEffect(() => {
    if (allFieldsSatisfied && file) {
      const reversedHeaderMappings = new Map(
        Array.from(headerMappings.entries()).map(([k, v]) => [v, k])
      );
      Papa.parse<UserCsvRow>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) =>
          reversedHeaderMappings.get(normalizeHeader(h)) ?? h,
        complete: (results) => {
          console.debug(results);
          setUsersToUpload(results.data);
        },
      });
    }
  }, [allFieldsSatisfied, file, headerMappings]);

  const usersTable = useReactTable({
    data: usersToUpload,
    columns: [
      {
        accessorKey: "firstName",
        header: "First Name",
      },
      {
        accessorKey: "lastName",
        header: "Last Name",
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ getValue }) => (
          <span className="overflow-hidden text-ellipses">{getValue()}</span>
        ),
      },
      {
        accessorKey: "unit",
        header: "Unit",
      },
      {
        accessorKey: "trainingGroup",
        header: "Training Group",
      },
    ],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  return (
    <SlideOver open={open} setOpen={setOpen}>
      <SlideOverForm
        onSubmit={(e) => e.preventDefault()}
        onClose={() => setOpen(false)}
      >
        <SlideOverHeading
          title="Upload Users CSV"
          description={"Use this tool to upload users in bulk from a CSV file."}
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
              <div className="grid grid-cols-4 space-y-2 divide-y divide-y-gray-200">
                <div className="text-sm font-semibold col-span-full grid grid-cols-subgrid">
                  <div>User Field</div>
                  <div></div>
                  <div>CSV Header</div>
                  <div></div>
                </div>
                {USER_FIELDS.filter(
                  (f) => !isUnitContext || f.name !== "unit"
                ).map((userField) => {
                  const selectedHeader = headerMappings.get(userField.name);
                  return (
                    <div
                      key={userField.name}
                      className="col-span-full grid grid-cols-subgrid pt-2 items-center"
                    >
                      <div className="text-sm font-regular">
                        {userField.label}
                      </div>
                      <ArrowRightIcon className="size-4" />
                      <Select
                        value={selectedHeader}
                        onChange={(e) =>
                          setHeaderMapping(userField.name, e.target.value)
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
              <div className="flex justify-between mt-10">
                <StepBackwardButton>Back</StepBackwardButton>
                <StepForwardButton>Next</StepForwardButton>
              </div>
            </Step>
            <Step name="Step 3: Review & Upload">
              <VirtualizedTable table={usersTable} height="400px" />
              <div className="flex mt-10">
                <StepBackwardButton>Back</StepBackwardButton>
              </div>
            </Step>
          </Steps2>
        </div>
      </SlideOverForm>
    </SlideOver>
  );
}

interface UserCsvRow {
  firstName: string;
  lastName: string;
  email: string;
  unit: string;
  trainingGroup?: string;
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

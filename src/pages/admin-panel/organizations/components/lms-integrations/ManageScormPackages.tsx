import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SlideOverFormBody from "../../../../../components/layouts/slide-over/SlideOverFormBody";
import SlideOverHeading from "../../../../../components/layouts/slide-over/SlideOverHeading";
import {
  LmsTrainingToken,
  Organization,
  TrainingItem,
} from "../../../../../types/entities";
import {
  getTrainingCourse,
  getTrainingItem,
} from "../../../../../queries/training";
import { DEFAULT_THUMBNAIL_URL } from "../../../../../constants/core";
import ButtonGroup from "../../../../../components/layouts/buttons/ButtonGroup";
import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  LockClosedIcon,
  LockOpenIcon,
  PlusCircleIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import IconButton from "../../../../../components/layouts/buttons/IconButton";
import dayjs from "dayjs";
import { Fragment, useCallback, useContext, useEffect, useMemo } from "react";
import {
  classNames,
  simulateDownload,
  slugify,
  stripHtml,
} from "../../../../../utils/core";
import {
  createOrganizationLmsToken,
  getLmsScormPackage,
  saveOrganization,
  setOrganizationLmsTokenExpirations,
} from "../../../../../queries/organizations";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useFieldArray, useForm } from "react-hook-form";
import { CoreContext } from "../../../../../contexts/core/core-context";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import SlideOverFormActionButtons from "../../../../../components/layouts/slide-over/SlideOverFormActionButtons";
import Input from "../../../../../components/forms/inputs/Input";
import { useDebounceCallback, useLocalStorage } from "usehooks-ts";
import { AlertContext } from "../../../../../contexts/alert/alert-context";

const DEFAULT_EXPIRED_DATE = dayjs().startOf("day").subtract(1, "day");
const DEFAULT_EXPIRATION_DATE = DEFAULT_EXPIRED_DATE.add(1, "year");

const TrainingItemDisplay: React.FC<{
  item: TrainingItem | null | undefined;
  grayscale?: boolean;
  loading?: boolean;
}> = ({ item, grayscale = false, loading = false }) => {
  return loading ? (
    <div className="rounded-md h-24 w-full animate-pulse bg-slate-200" />
  ) : item ? (
    <div
      className={classNames(
        "rounded-md overflow-hidden flex ring-1 ring-inset ring-gray-200",
        grayscale ? "grayscale opacity-50" : ""
      )}
    >
      <div className="flex overflow-hidden relative pt-24 pr-40">
        <img
          className="w-full h-full absolute object-cover inset-0"
          src={item.thumbnailUrl ?? DEFAULT_THUMBNAIL_URL}
          alt={item.metadata.title}
        />
      </div>
      <div className="px-4 py-2">
        <h2
          className="text-base my-1"
          dangerouslySetInnerHTML={{ __html: item.metadata.title ?? "" }}
        />
        <p
          className="text-gray-500 text-xs line-clamp-5"
          dangerouslySetInnerHTML={{
            __html: item.metadata.description ?? "",
          }}
        />
      </div>
    </div>
  ) : (
    <></>
  );
};

const LmsTokenRow: React.FC<{ lmsToken: LmsTrainingToken }> = ({
  lmsToken,
}) => {
  const { setInfo } = useContext(AlertContext);
  const { setConfirmationOpen, setConfirmationClose } = useContext(CoreContext);

  const { data: item, isLoading: itemLoading } = useQuery({
    queryKey: ["trainingItem", lmsToken.value.trainingItemId] as const,
    queryFn: ({ queryKey }) => getTrainingItem(queryKey[1]),
  });

  const expired = useMemo(
    () => !!lmsToken.expiresOn && dayjs(lmsToken.expiresOn).isBefore(dayjs()),
    [lmsToken]
  );

  const { register, handleSubmit: handleExpirationSubmit } = useForm({
    values: {
      expiration: dayjs(lmsToken.expiresOn).format("YYYY-MM-DD"),
    },
  });

  const queryClient = useQueryClient();
  const setExpirationMutation = useMutation({
    mutationFn: (date: dayjs.Dayjs | null) =>
      setOrganizationLmsTokenExpirations(
        lmsToken.value.organizationId,
        { key: lmsToken.key },
        date && date.toDate()
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "lmsTokens",
          lmsToken.value.organizationId,
          lmsToken.value.enrollmentId,
        ],
      });
    },
  });

  const handleConfirmExpiration = (expiration: dayjs.Dayjs | null) => {
    if (expiration && expiration.isBefore(dayjs())) {
      setConfirmationOpen({
        title: "Revoke Training Access?",
        message: (
          <span>
            This will set the expiration to the{" "}
            <span className="font-bold">past, {expiration.format("ll")}</span>,
            which will effectively revoke and disable access to this training.
          </span>
        ),
        destructive: true,
        onConfirm: () => {
          setExpirationMutation.mutate(expiration);
          setConfirmationClose();
        },
      });
    } else {
      setExpirationMutation.mutate(expiration);
    }
  };

  const handleSetExpiration = (close: () => void) => {
    handleExpirationSubmit((data) => {
      handleConfirmExpiration(dayjs(data.expiration));
      close();
    })();
  };

  const downloadLmsScormPackageMutation = useMutation({
    mutationFn: (lmsToken: LmsTrainingToken) =>
      getLmsScormPackage(lmsToken.value.organizationId, lmsToken.key),
    onSuccess: (data) => {
      const trainingTitle = item
        ? slugify(stripHtml(item.metadata.title)).slice(0, 50)
        : "training";
      simulateDownload(
        new Blob([data]),
        `threatzero_${trainingTitle}_scorm.zip`
      );
      setTimeout(() => setInfo(), 2000);
    },
    onError: () => {
      setInfo();
    },
  });

  const handleDownloadScormPackage = () => {
    setInfo("Downloading SCORM package...");
    downloadLmsScormPackageMutation.mutate(lmsToken);
  };

  return (
    <div className="flex flex-col gap-2">
      <TrainingItemDisplay
        item={item}
        grayscale={expired}
        loading={itemLoading}
      />
      <span className="text-sm font-semibold">
        <span>
          {expired ? (
            <span className="text-red-500">Revoked</span>
          ) : (
            <span className="text-green-500">Active</span>
          )}
        </span>
        {" - "}
        {lmsToken.expiresOn
          ? (expired ? "Expired" : "Expires") +
            ` on ${dayjs(lmsToken.expiresOn).format("ll")}`
          : "Never expires"}
      </span>

      <div className="flex gap-2 justify-between w-full">
        <ButtonGroup>
          <Popover as={Fragment}>
            {({ open, close }) => (
              <>
                <IconButton
                  as={PopoverButton}
                  icon={ClockIcon}
                  text="Set Expiration"
                  className="ring-gray-300 hover:bg-gray-100"
                />
                <AnimatePresence>
                  {open && (
                    <PopoverPanel
                      className="bg-white shadow sm:rounded-lg [--anchor-gap:8px]"
                      anchor="bottom start"
                      static
                      as={motion.div}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">
                          Set Access Expiration
                        </h3>
                        <div className="mt-2 max-w-md text-sm text-gray-500">
                          <p>
                            This is the last day the organizaiton will be able
                            to use this token to access the associated training
                            item.
                          </p>
                        </div>
                        <div className="mt-5 sm:flex sm:items-center w-full">
                          <div className="w-full">
                            <label htmlFor="idp-alias" className="sr-only">
                              IDP Alias
                            </label>
                            <input
                              id="idp-alias"
                              type="date"
                              {...register("expiration")}
                              onKeyUp={(e) =>
                                e.key === "Enter" && handleSetExpiration(close)
                              }
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-secondary-600 sm:text-sm sm:leading-6"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSetExpiration(close)}
                            className="mt-3 inline-flex w-full items-center justify-center rounded-md transition-colors bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600 sm:ml-3 sm:mt-0 sm:w-auto"
                          >
                            Set
                          </button>
                        </div>
                      </div>
                    </PopoverPanel>
                  )}
                </AnimatePresence>
              </>
            )}
          </Popover>
          <IconButton
            icon={expired ? LockOpenIcon : LockClosedIcon}
            text={expired ? "Grant Access" : "Revoke Access"}
            className={classNames(
              "text-white ring-transparent",
              expired
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
            )}
            onClick={() =>
              handleConfirmExpiration(
                expired ? DEFAULT_EXPIRATION_DATE : DEFAULT_EXPIRED_DATE
              )
            }
          />
        </ButtonGroup>
        <ButtonGroup>
          <IconButton
            icon={ArrowDownTrayIcon}
            text="Download SCORM"
            type="button"
            className="bg-secondary-500 text-white enabled:hover:bg-secondary-600 ring-transparent disabled:opacity-50 disabled:cursor-default"
            onClick={() => handleDownloadScormPackage()}
            disabled={expired}
            title={
              expired
                ? "Grant access to enable download"
                : "Download SCORM package (.zip)"
            }
          />
        </ButtonGroup>
      </div>
    </div>
  );
};

interface ManageScormPackagesProps {
  setOpen: (open: boolean) => void;
  lmsTokens: LmsTrainingToken[];
  organizationId: string | undefined;
  enrollmentId: string | undefined;
  courseId: string | undefined;
  accessSettings?: Organization["trainingAccessSettings"];
}

const ManageScormPackages: React.FC<ManageScormPackagesProps> = ({
  setOpen: setOpenProp,
  lmsTokens,
  organizationId,
  enrollmentId,
  courseId,
  accessSettings: trainingAccessSettings,
}) => {
  const [showOrgLmsSettings, setShowOrgLmsSettings] = useLocalStorage(
    "threatzero.organizations.show-lms-settings",
    true
  );

  const { data: allItems } = useQuery({
    queryKey: ["training-course", courseId, "items"],
    queryFn: () =>
      getTrainingCourse(courseId!).then((c) =>
        Array.from(
          c?.sections
            .flatMap((s) => s.items?.map((i) => i.item))
            .filter((i) => !!i)
            .reduce((arr, i) => {
              if (i) {
                arr.set(i.id, i);
              }
              return arr;
            }, new Map<TrainingItem["id"], TrainingItem>())
            .values() ?? []
        )
      ),
    enabled: !!courseId && !!lmsTokens,
  });

  const availableItems = useMemo(
    () =>
      allItems?.filter(
        (i) => !lmsTokens.some((t) => t.value.trainingItemId === i.id)
      ),
    [allItems, lmsTokens]
  );

  const queryClient = useQueryClient();

  const createLmsTokenMutation = useMutation({
    mutationFn: (itemId: TrainingItem["id"]) =>
      organizationId
        ? createOrganizationLmsToken(
            organizationId,
            {
              trainingItemId: itemId,
              organizationId,
              enrollmentId,
            },
            DEFAULT_EXPIRATION_DATE.toDate()
          )
        : Promise.reject("No organization ID."),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["lmsTokens", organizationId, enrollmentId],
      });
    },
  });

  const {
    register: registerAccessSetting,
    control: accessSettingControl,
    watch: watchAccessSettings,
    handleSubmit: handleAccessSettingsSubmit,
    formState: {
      isDirty: accessSettingsIsDirty,
      isValid: accessSettingsIsValid,
    },
  } = useForm({
    defaultValues: trainingAccessSettings ?? {},
  });

  const updateOrganizationMutation = useMutation({
    mutationFn: (data: Pick<Organization, "id" | "trainingAccessSettings">) =>
      saveOrganization(data),
  });

  const handleUpdateOrganization = useCallback(() => {
    if (!organizationId || !accessSettingsIsDirty || !accessSettingsIsValid)
      return;
    handleAccessSettingsSubmit((data) =>
      updateOrganizationMutation.mutate({
        id: organizationId,
        trainingAccessSettings: data,
      })
    )();
  }, [
    organizationId,
    accessSettingsIsDirty,
    accessSettingsIsValid,
    updateOrganizationMutation,
    handleAccessSettingsSubmit,
  ]);

  const debounceUpdateOrganizationAccessSettings = useDebounceCallback(
    handleUpdateOrganization,
    1000
  );

  useEffect(() => {
    const { unsubscribe } = watchAccessSettings(() => {
      debounceUpdateOrganizationAccessSettings();
    });

    return () => {
      unsubscribe();
    };
  }, [watchAccessSettings, debounceUpdateOrganizationAccessSettings]);

  const setOpen = (open: boolean) => {
    // Manipulate the setOpen function to only invalidate the organizations
    // query when the slide over is closed. This is because invalidating the
    // query will rerender the page and close the slider.
    setOpenProp(open);
    if (!open) {
      setTimeout(
        () =>
          queryClient.invalidateQueries({
            queryKey: ["organizations", organizationId],
          }),
        300
      );
    }
  };

  const {
    fields,
    append: addAllowedDomain,
    remove: removeAllowedDomain,
  } = useFieldArray({
    control: accessSettingControl,
    name: "allowedOrigins",
  });

  return (
    <div className="flex h-screen flex-col">
      <SlideOverHeading
        title="Manage Scorm Packages"
        description="A SCORM package allows an external LMS to import our training content. Here you can automatically create a SCORM package for any training item or revoke access to an existing SCORM integration."
        setOpen={setOpen}
      >
        <div className="flex flex-col pt-2 text-gray-500">
          <button
            type="button"
            onClick={() => setShowOrgLmsSettings((v) => !v)}
            className="text-start text-sm text-secondary-600 hover:text-secondary-700 transition-colors inline-flex items-center gap-1"
          >
            <span>
              {showOrgLmsSettings
                ? "Hide access settings"
                : "Show access settings"}
            </span>
            {showOrgLmsSettings ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </button>
          <Transition show={showOrgLmsSettings}>
            <div
              className={classNames(
                "flex flex-col gap-3 transition-all duration-500 ease-in-out max-h-32 overflow-hidden mt-3",
                "data-[closed]:max-h-0 data-[closed]:mt-0 data-[closed]:opacity-0"
              )}
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs">Allowed LMS Domains</span>
                {fields.map((field, idx) => (
                  <div className="relative w-full" key={field.id}>
                    <Input
                      type="text"
                      className="w-full pr-10"
                      required
                      {...registerAccessSetting(`allowedOrigins.${idx}.value`, {
                        validate: (value) => {
                          try {
                            if (value === "*") return true;
                            if (!value) return false;
                            new URL(value);
                            return true;
                          } catch (e) {
                            return false;
                          }
                        },
                      })}
                    />
                    <button
                      type="button"
                      className="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-3 group"
                    >
                      <XMarkIcon
                        className="size-4 text-gray-400 group-hover:text-gray-500 transition-colors"
                        onClick={() => removeAllowedDomain(idx)}
                      />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-xs text-secondary-500 hover:enabled:text-secondary-600 transition-colors text-start"
                  onClick={() => addAllowedDomain({ value: "" })}
                >
                  + Add Domain
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </SlideOverHeading>
      <SlideOverFormBody>
        {lmsTokens.map((lmsToken) => (
          <div
            className="px-4 py-5 sm:px-6 lg:px-8 flex flex-col gap-2"
            key={lmsToken.id}
          >
            <LmsTokenRow lmsToken={lmsToken} />
          </div>
        ))}
        {availableItems?.map((item) => (
          <div
            className="px-4 py-5 sm:px-6 lg:px-8 flex flex-col gap-2"
            key={item.id}
          >
            <TrainingItemDisplay item={item} grayscale />
            <ButtonGroup className="justify-end">
              <IconButton
                icon={PlusCircleIcon}
                text="Create SCORM Package"
                type="button"
                className="bg-secondary-500 text-white hover:bg-secondary-600 ring-transparent"
                onClick={() => createLmsTokenMutation.mutate(item.id)}
              />
            </ButtonGroup>
          </div>
        ))}
        {lmsTokens.length === 0 && availableItems?.length === 0 && (
          <div className="px-4 py-5 sm:px-6 lg:px-8 flex flex-col gap-2">
            <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-500" />
            <p className="text-center text-gray-500">
              No training content available.
            </p>
          </div>
        )}
      </SlideOverFormBody>
      <SlideOverFormActionButtons onClose={() => setOpen(false)} readOnly />
    </div>
  );
};

export default ManageScormPackages;

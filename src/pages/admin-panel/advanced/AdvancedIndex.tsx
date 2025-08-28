import {
  ArrowPathIcon,
  EyeIcon,
  FireIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import dayjs from "dayjs";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useImmer } from "use-immer";
import Input from "../../../components/forms/inputs/Input";
import OrganizationSelect from "../../../components/forms/inputs/OrganizationSelect";
import IconButton from "../../../components/layouts/buttons/IconButton";
import Modal from "../../../components/layouts/modal/Modal";
import DataTable2 from "../../../components/layouts/tables/DataTable2";
import { AlertContext } from "../../../contexts/alert/alert-context";
import { useAuth } from "../../../contexts/auth/useAuth";
import {
  getMyOrganization,
  getOrganization,
} from "../../../queries/organizations";
import { buildUrl } from "../../../queries/utils";
import TrainingPickerModal from "../../safety-management/training-admin/components/training-picker/TrainingPickerModal";

export default function AdvancedIndex() {
  const { accessTokenClaims } = useAuth();
  const { setSuccess } = useContext(AlertContext);

  const [selfDestructLoading, setSelfDestructLoading] = useState(false);
  const [showPhonyWebsiteBrokenOverlay, setShowPhonyWebsiteBrokenOverlay] =
    useState(false);

  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  useEffect(() => {
    setSelectedEmail(
      accessTokenClaims?.email ? String(accessTokenClaims.email) : null
    );
  }, [accessTokenClaims?.email]);

  const [trainingPickerOpen, setTrainingPickerOpen] = useState(false);
  const [trainingData, setTrainingData] = useImmer<{
    enrollmentId: string | null;
    itemId: string | null;
  }>({
    enrollmentId: null,
    itemId: null,
  });

  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    string | null
  >();

  const { data: selectedOrganization } = useQuery({
    queryKey: ["organizations", selectedOrganizationId] as const,
    queryFn: ({ queryKey }) =>
      queryKey[1] ? getOrganization(queryKey[1]) : getMyOrganization(),
    enabled: selectedOrganizationId !== null,
  });

  const {
    mutate: sendTestReminderEmail,
    isPending: isSendingTestReminderEmail,
  } = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        buildUrl("/admin/send-test-training-reminder-email"),
        {
          email: selectedEmail,
          enrollmentId: trainingData.enrollmentId,
          itemId: trainingData.itemId,
          organizationId: selectedOrganization?.id,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      setSuccess("Test training reminder email sent!", {
        timeout: 5000,
      });
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold leading-6 text-gray-900">
          Advanced Stuff
        </h3>
        <p className="mt-2 text-sm text-gray-700">
          Knobs, switches, and other buttons reserved only for the initiated.
        </p>
      </div>
      <div className="flex flex-col gap-8">
        <div>
          <h4 className="text-sm font-semibold leading-6 text-gray-900">
            Don't push this button!
          </h4>
          <IconButton
            icon={FireIcon}
            text="Self-destruct"
            loading={selfDestructLoading}
            className="bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={selfDestructLoading}
            onClick={() => {
              setSelfDestructLoading(true);
              setTimeout(() => {
                setShowPhonyWebsiteBrokenOverlay(true);
                setSelfDestructLoading(false);
              }, 2000);
            }}
          />
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="text-sm font-semibold leading-6 text-gray-900">
            Useful stuff
          </h4>
          <div className="flex flex-col gap-2">
            <h5 className="text-xs font-semibold leading-6 text-gray-900">
              Send test reminder email
            </h5>
            <div className="flex gap-2">
              <OrganizationSelect
                value={
                  selectedOrganizationId === null
                    ? null
                    : selectedOrganization?.slug
                }
                onChange={(e) => {
                  if (e.target?.value) {
                    if (typeof e.target.value === "string") {
                      setSelectedOrganizationId(e.target.value);
                    } else {
                      setSelectedOrganizationId(e.target.value.id);
                    }
                  } else {
                    setSelectedOrganizationId(null);
                  }
                }}
              />
              <button
                onClick={() => setTrainingPickerOpen(true)}
                className="rounded-md bg-secondary-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {trainingData.enrollmentId ? "Change" : "Pick"} Training
              </button>
              <Input
                type="email"
                value={selectedEmail ?? ""}
                onChange={(e) => setSelectedEmail(e.target.value)}
              />
              <IconButton
                icon={PaperAirplaneIcon}
                text="Send"
                loading={isSendingTestReminderEmail}
                className="rounded-md bg-secondary-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => sendTestReminderEmail()}
                disabled={
                  !selectedEmail ||
                  !selectedOrganization ||
                  !trainingData.enrollmentId ||
                  !trainingData.itemId
                }
              />
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold leading-6 text-gray-900">
            Job queues
          </h4>
          <AdvancedJobQueues />
        </div>
      </div>
      {showPhonyWebsiteBrokenOverlay && (
        <PhonyWebsiteBrokenOverlay setOpen={setShowPhonyWebsiteBrokenOverlay} />
      )}
      {selectedOrganization && (
        <TrainingPickerModal
          organizationId={selectedOrganization?.id}
          open={trainingPickerOpen}
          setOpen={setTrainingPickerOpen}
          onChangeTrainingData={(data) => {
            setTrainingData((draft) => {
              draft.enrollmentId = data.courseEnrollment.id;
              draft.itemId =
                data.sectionAndWindow.section.items?.at(0)?.item.id ?? null;
            });
          }}
        />
      )}
    </div>
  );
}

function PhonyWebsiteBrokenOverlay({
  setOpen,
}: {
  setOpen: (open: boolean) => void;
}) {
  const [showJustKidding, setShowJustKidding] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const handleCountdown = useCallback(() => {
    const stepDown = (prevCountdown: number) => {
      if (prevCountdown > 0) {
        setCountdown(prevCountdown - 1);
        setTimeout(() => {
          stepDown(prevCountdown - 1);
        }, 1000);
      } else {
        setOpen(false);
      }
    };

    stepDown(countdown);
  }, [countdown, setOpen]);

  useEffect(() => {
    setTimeout(() => {
      setShowJustKidding(true);
      setTimeout(() => {
        setShowCountdown(true);
        handleCountdown();
      }, 1000);
    }, 3000);
  }, [handleCountdown]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center gap-8 z-[1000000]">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Website is down</h2>
        <p className="text-gray-600">
          We're sorry, but the website can't be accessed right now.
        </p>
      </div>
      {showJustKidding && (
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-5xl font-bold text-white">just kidding 😜</h1>
          {showCountdown && (
            <h1 className="text-8xl font-bold text-white">{countdown + 1}</h1>
          )}
        </div>
      )}
    </div>
  );
}

function AdvancedJobQueues() {
  const { setSuccess } = useContext(AlertContext);
  const queryClient = useQueryClient();
  const { data: jobQueues } = useQuery({
    queryKey: ["job-queues"],
    queryFn: () => getJobQueues(),
    refetchInterval: 5000,
  });

  const {
    mutate: retryJob,
    isPending: isRetryJobPending,
    variables: retryJobVariables,
  } = useMutation({
    mutationFn: ({
      queueName,
      jobId,
    }: {
      queueName: string;
      jobId: string;
    }) => {
      return axios.post(
        buildUrl(`/notifications/job-queues/${queueName}/retry-job/${jobId}`)
      );
    },
    onSuccess: (_data, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ["job-queues"] });
      setSuccess(`Request to retry job ${jobId} was sent.`, {
        timeout: 5000,
      });
    },
  });

  const {
    mutate: removeJob,
    isPending: isRemoveJobPending,
    variables: removeJobVariables,
  } = useMutation({
    mutationFn: ({
      queueName,
      jobId,
    }: {
      queueName: string;
      jobId: string;
    }) => {
      return axios.post(
        buildUrl(`/notifications/job-queues/${queueName}/remove-job/${jobId}`)
      );
    },
    onSuccess: (_data, { jobId, queueName }) => {
      queryClient.invalidateQueries({ queryKey: ["job-queues"] });
      setSuccess(`Job ${jobId} was removed from queue ${queueName}.`, {
        timeout: 5000,
      });
    },
  });

  const commonJobColumns = useMemo(
    (): ColumnDef<Job<unknown>>[] => [
      {
        accessorKey: "id",
      },
      {
        accessorKey: "name",
      },
      {
        accessorKey: "timestamp",
        cell: ({ getValue }) =>
          dayjs(getValue() as number).format("YYYY-MM-DD HH:mm:ss"),
      },
      {
        accessorKey: "data",
        cell: ({ getValue }) => {
          const data = getValue() as Record<string, unknown>;
          return <ViewValueDetailsModal text="View data" value={data} />;
        },
      },
    ],
    []
  );

  const failedJobColumns = useMemo(
    (): ColumnDef<Job<unknown>>[] => [
      ...commonJobColumns,
      {
        accessorKey: "failedReason",
      },
      {
        accessorKey: "stacktrace",
        cell: ({ getValue }) => {
          const stacktrace = getValue() as string[];
          return (
            <ViewValueDetailsModal text="View stacktrace" value={stacktrace} />
          );
        },
      },
      {
        accessorKey: "attemptsMade",
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const job = row.original;
          const isRetrying =
            isRetryJobPending &&
            retryJobVariables?.jobId === job.id &&
            retryJobVariables?.queueName === job.queueQualifiedName;

          const isRemoving =
            isRemoveJobPending &&
            removeJobVariables?.jobId === job.id &&
            removeJobVariables?.queueName === job.queueQualifiedName;

          return (
            <div className="flex gap-2">
              <IconButton
                icon={ArrowPathIcon}
                title="Retry job"
                onClick={() => {
                  retryJob({
                    jobId: job.id,
                    queueName: job.queueQualifiedName,
                  });
                }}
                disabled={isRetrying}
                classNames={{
                  icon: isRetrying ? "animate-spin" : "",
                  text: isRetrying ? "text-gray-500" : "",
                  button: isRetrying ? "animate-pulse" : "",
                }}
              />
              <IconButton
                icon={XMarkIcon}
                title="Remove job"
                onClick={() => {
                  removeJob({
                    jobId: job.id,
                    queueName: job.queueQualifiedName,
                  });
                }}
                disabled={isRemoving}
                classNames={{
                  icon: isRemoving ? "animate-spin" : "",
                  text: isRemoving ? "text-gray-500" : "",
                  button: isRemoving ? "animate-pulse" : "",
                }}
              />
            </div>
          );
        },
      },
    ],
    [
      commonJobColumns,
      retryJob,
      removeJob,
      isRetryJobPending,
      retryJobVariables,
      isRemoveJobPending,
      removeJobVariables,
    ]
  );

  const waitingJobColumns = useMemo(
    (): ColumnDef<Job<unknown>>[] => [...commonJobColumns],
    [commonJobColumns]
  );

  const activeJobColumns = useMemo(
    (): ColumnDef<Job<unknown>>[] => [...commonJobColumns],
    [commonJobColumns]
  );

  return (
    <div className="flex flex-col gap-8 mt-4">
      {jobQueues ? (
        jobQueues.map((jobQueue) => (
          <div key={jobQueue.queueName}>
            <h1 className="text-sm mb-1 flex items-center gap-2">
              <div className="py-1 px-2 rounded-md border border-gray-600 w-max">
                Queue name
              </div>
              <span>{jobQueue.queueName}</span>
            </h1>
            <div className="flex flex-col gap-6">
              {[
                {
                  title: "Failed jobs",
                  data: jobQueue.failedJobs,
                  columns: failedJobColumns,
                },
                {
                  title: "Waiting jobs",
                  data: jobQueue.waitingJobs,
                  columns: waitingJobColumns,
                },
                {
                  title: "Active jobs",
                  data: jobQueue.activeJobs,
                  columns: activeJobColumns,
                },
              ].map(({ title, data, columns }) => (
                <div className="flex flex-col gap-2" key={title}>
                  <h2 className="text-sm font-semibold">{title}</h2>
                  <DataTable2 data={data} columns={columns} />
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-lg w-full h-72 animate-pulse bg-card"></div>
      )}
    </div>
  );
}

function ViewValueDetailsModal({
  text,
  value,
}: {
  text: string;
  value: unknown;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton icon={EyeIcon} text={text} onClick={() => setOpen(true)} />
      <Modal open={open} setOpen={setOpen}>
        <pre className="text-xs whitespace-pre-wrap py-2 px-4">
          {JSON.stringify(value, null, 2)}
        </pre>
      </Modal>
    </>
  );
}

export interface JobQueue {
  queueName: string;
  failedJobs: Job<unknown>[];
  waitingJobs: Job<unknown>[];
  activeJobs: Job<unknown>[];
}

export interface Job<TData> {
  name: string;
  data: TData;
  opts: {
    attempts: number;
    backoff: {
      delay: number;
      type: "exponential";
    };
  };
  id: string;
  progress: number;
  returnvalue: unknown;
  stacktrace: string[];
  delay: number;
  priority: number;
  attemptsStarted: number;
  attemptsMade: number;
  timestamp: number;
  queueQualifiedName: string;
  finishedOn: number;
  processedOn: number;
  failedReason: string;
}

const getJobQueues = async () => {
  const response = await axios.get(buildUrl("/notifications/job-queues"));

  return response.data as JobQueue[];
};

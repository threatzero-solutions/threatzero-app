import { ArrowPathIcon, EyeIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import dayjs from "dayjs";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import IconButton from "../../../components/layouts/buttons/IconButton";
import Modal from "../../../components/layouts/modal/Modal";
import DataTable2 from "../../../components/layouts/tables/DataTable2";
import { AlertContext } from "../../../contexts/alert/alert-context";
import { buildUrl } from "../../../queries/utils";

export default function AdvancedIndex() {
  const { setSuccess } = useContext(AlertContext);
  const [showPhonyWebsiteBrokenOverlay, setShowPhonyWebsiteBrokenOverlay] =
    useState(false);

  const { mutate: sendTestReminderEmail } = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        buildUrl("/admin/send-test-training-reminder-email")
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
          <button
            className="rounded-md bg-red-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-red-600"
            onClick={() => setShowPhonyWebsiteBrokenOverlay(true)}
          >
            Self-destruct
          </button>
        </div>

        <div>
          <h4 className="text-sm font-semibold leading-6 text-gray-900">
            Useful buttons
          </h4>
          <button
            className="rounded-md bg-secondary-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
            onClick={() => sendTestReminderEmail()}
          >
            Send test reminder email
          </button>
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

import { CheckIcon } from "@heroicons/react/20/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import Form from "../../../components/forms/Form";
import BackButton from "../../../components/layouts/BackButton";
import EditableCell from "../../../components/layouts/EditableCell";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import ManageNotes from "../../../components/notes/ManageNotes";
import StatusBadgePicker, {
  StatusOption,
} from "../../../components/StatusBadgePicker";
import { VIOLENT_INCIDENT_REPORT_FORM_SLUG } from "../../../constants/forms";
import { LEVEL, WRITE } from "../../../constants/permissions";
import { AlertContext } from "../../../contexts/alert/alert-context";
import { useAlertId } from "../../../contexts/alert/use-alert-id";
import { useAuth } from "../../../contexts/auth/useAuth";
import { API_BASE_URL } from "../../../contexts/core/constants";
import {
  addViolentIncidentReportNote,
  getViolentIncidentReportForm,
  getViolentIncidentReportNotes,
  getViolentIncidentReportSubmission,
  saveViolentIncidentReport,
  violentIncidentReportToPdf,
} from "../../../queries/safety-management";
import { DeepPartial } from "../../../types/core";
import {
  FormState,
  FormSubmission,
  ViolentIncidentReportStatus,
} from "../../../types/entities";
import { fromStatus, simulateDownload } from "../../../utils/core";

const VIR_STATUS_OPTIONS: StatusOption<ViolentIncidentReportStatus>[] = [
  {
    value: ViolentIncidentReportStatus.NEW,
    label: fromStatus(ViolentIncidentReportStatus.NEW),
    tone: "primary",
  },
  {
    value: ViolentIncidentReportStatus.REVIEWED,
    label: fromStatus(ViolentIncidentReportStatus.REVIEWED),
    tone: "success",
  },
];

const MEDIA_UPLOAD_URL = `${API_BASE_URL}/violent-incident-reports/submissions/presigned-upload-urls`;

const ViolentIncidentReportForm: React.FC = () => {
  const [manageNotesOpen, setManageNotesOpen] = useState(false);

  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { setInfo, clearAlert } = useContext(AlertContext);
  const infoAlertId = useAlertId();

  const { hasPermissions } = useAuth();

  const isEditing = useMemo(() => searchParams.has("edit"), [searchParams]);
  const setIsEditing = useCallback(
    (editing: boolean) =>
      setSearchParams(
        (p) => {
          if (editing) p.set("edit", "true");
          else p.delete("edit");
          return p;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  const canAlterForm = useMemo(
    () => hasPermissions([LEVEL.ADMIN, WRITE.FORMS]),
    [hasPermissions],
  );
  const canAlterViolentIncidentReport = useMemo(
    () => hasPermissions([WRITE.VIOLENT_INCIDENT_REPORTS]),
    [hasPermissions],
  );

  const queryClient = useQueryClient();

  const { data: violentIncidentReport } = useQuery({
    queryKey: ["violent-incident-report", params.reportId],
    queryFn: ({ queryKey }) => getViolentIncidentReportSubmission(queryKey[1]),
    enabled: !!params.reportId,
  });

  const { data: form, isLoading: formLoading } = useQuery({
    queryKey: [
      "violent-incident-report-form",
      violentIncidentReport?.submission.formId,
    ],
    queryFn: ({ queryKey }) =>
      getViolentIncidentReportForm({ id: queryKey[1] ?? undefined }),
    enabled: !params.reportId || !!violentIncidentReport,
  });

  const notesQueryKey = ["violent-incident-report-notes", params.reportId];
  const { data: notes } = useQuery({
    queryKey: notesQueryKey,
    queryFn: ({ queryKey }) =>
      getViolentIncidentReportNotes(queryKey[1], { limit: 50 }),
    enabled: !!params.reportId,
  });

  useEffect(() => {
    if (params.reportId === undefined) {
      setIsEditing(true);
    }
  }, [params.reportId, setIsEditing]);

  const violentIncidentReportMutation = useMutation({
    mutationFn: saveViolentIncidentReport,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["assessment", params.assessmentId],
      });

      if (!params.reportId) {
        navigate(`../${data.id}?edit=true`);
      }
    },
  });

  const changeStatus = useCallback(
    (status: ViolentIncidentReportStatus) => {
      const m = violentIncidentReportMutation.mutate;
      m({
        id: params.reportId,
        status,
      });
    },
    [violentIncidentReportMutation.mutate, params.reportId],
  );

  const downloadViolentIncidentReportToPdfMutation = useMutation({
    mutationFn: violentIncidentReportToPdf,
    onSuccess: (data) => {
      simulateDownload(new Blob([data]), "violent-incident-report.pdf");

      setTimeout(() => clearAlert(infoAlertId), 2000);
    },
    onError: () => {
      clearAlert(infoAlertId);
    },
  });

  const downloadPdf = useCallback(() => {
    if (!violentIncidentReport) return;
    setInfo("Downloading as PDF...", { id: infoAlertId });
    downloadViolentIncidentReportToPdfMutation.mutate(violentIncidentReport.id);
  }, [
    violentIncidentReport,
    downloadViolentIncidentReportToPdfMutation,
    setInfo,
    infoAlertId,
  ]);

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
    submission: DeepPartial<FormSubmission>,
  ) => {
    event.preventDefault();

    violentIncidentReportMutation.mutate({
      id: params.reportId,
      submission: {
        ...submission,
        form: {
          id: form?.id,
        },
      },
    });
  };

  return (
    <>
      <BackButton defaultTo={"../"} valueOnDefault="Back to Dashboard" />
      {violentIncidentReport && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mb-4 sticky top-16 border-b bg-gray-50 border-gray-200 py-5 z-10">
          <div className="flex items-center gap-3">
            <StatusBadgePicker
              value={violentIncidentReport.status}
              options={VIR_STATUS_OPTIONS}
              onChange={changeStatus}
              disabled={!canAlterViolentIncidentReport}
              loading={violentIncidentReportMutation.isPending}
            />
            <span className="flex items-center gap-1 text-sm">
              <span className="font-medium">Tag:</span>
              <span className="italic">
                <EditableCell
                  value={violentIncidentReport.tag}
                  onSave={(tag) =>
                    violentIncidentReportMutation.mutate({
                      id: violentIncidentReport.id,
                      tag,
                    })
                  }
                  emptyValue="—"
                  readOnly={!canAlterViolentIncidentReport}
                  alwaysShowEdit
                />
              </span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canAlterViolentIncidentReport && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-secondary-800 ring-1 ring-inset ring-warm-300 hover:bg-warm-50 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={downloadPdf}
              disabled={downloadViolentIncidentReportToPdfMutation.isPending}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-secondary-800 ring-1 ring-inset ring-warm-300 hover:bg-warm-50 disabled:opacity-60 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={() => setManageNotesOpen(true)}
              className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Notes {notes && <span>({notes?.results.length ?? 0})</span>}
            </button>
          </div>
        </div>
      )}
      {form === null || form?.state === FormState.DRAFT ? (
        <div className="w-full flex flex-col items-center gap-4">
          <p>
            {form && canAlterForm
              ? "No violent incident report form has been published."
              : "No violent incident report form available."}
          </p>
          {canAlterForm && (
            <Link
              to={`/admin-panel/forms/${VIOLENT_INCIDENT_REPORT_FORM_SLUG}`}
            >
              <button
                type="button"
                className="block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                {form ? "Edit Draft" : "+ Create Violent Incident Log Form"}
              </button>
            </Link>
          )}
        </div>
      ) : (
        <Form
          form={form}
          isLoading={formLoading}
          onSubmit={handleSubmit}
          submission={violentIncidentReport?.submission}
          readOnly={!canAlterViolentIncidentReport || !isEditing}
          collapsedSteps={true}
          actions={[
            {
              id: "auto-save",
              type: "submit",
              value: (
                <span className="flex">
                  <CheckIcon className="h-5 w-5 text-green-400 mr-1" />
                  <span>Auto-saved</span>
                </span>
              ),
              autoExecute: true,
              autoExecuteProgressText: "Auto-saving...",
              autoExecuteLoading: violentIncidentReportMutation.isPending,
            },
          ]}
          mediaUploadUrl={MEDIA_UPLOAD_URL}
        />
      )}
      <SlideOver open={manageNotesOpen} setOpen={setManageNotesOpen}>
        <ManageNotes
          setOpen={setManageNotesOpen}
          addNote={(n) => addViolentIncidentReportNote(params.reportId, n)}
          queryKey={notesQueryKey}
          notes={notes?.results}
          mediaUploadUrl={MEDIA_UPLOAD_URL}
        />
      </SlideOver>
    </>
  );
};

export default ViolentIncidentReportForm;

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addViolentIncidentReportNote,
  getViolentIncidentReportForm,
  getViolentIncidentReportNotes,
  getViolentIncidentReportSubmission,
  saveViolentIncidentReport,
  violentIncidentReportToPdf,
} from "../../../queries/safety-management";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  FormState,
  FormSubmission,
  ViolentIncidentReportStatus,
} from "../../../types/entities";
import Form from "../../../components/forms/Form";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import StatusPill from "./components/StatusPill";
import { LEVEL, WRITE } from "../../../constants/permissions";
import { VIOLENT_INCIDENT_REPORT_FORM_SLUG } from "../../../constants/forms";
import BackButton from "../../../components/layouts/BackButton";
import Dropdown, { DropdownAction } from "../../../components/layouts/Dropdown";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import ManageNotes from "../../../components/notes/ManageNotes";
import { CheckIcon } from "@heroicons/react/20/solid";
import { API_BASE_URL } from "../../../contexts/core/constants";
import EditableCell from "../../../components/layouts/EditableCell";
import { DeepPartial } from "../../../types/core";
import { useAuth } from "../../../contexts/auth/useAuth";
import { simulateDownload } from "../../../utils/core";
import { AlertContext } from "../../../contexts/alert/alert-context";

const MEDIA_UPLOAD_URL = `${API_BASE_URL}/violent-incident-reports/submissions/presigned-upload-urls`;

const ViolentIncidentReportForm: React.FC = () => {
  const [manageNotesOpen, setManageNotesOpen] = useState(false);

  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { setInfo } = useContext(AlertContext);
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
        { replace: true }
      ),
    [setSearchParams]
  );

  const canAlterForm = useMemo(
    () => hasPermissions([LEVEL.ADMIN, WRITE.FORMS]),
    [hasPermissions]
  );
  const canAlterViolentIncidentReport = useMemo(
    () => hasPermissions([WRITE.VIOLENT_INCIDENT_REPORTS]),
    [hasPermissions]
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

  const { data: notes } = useQuery({
    queryKey: ["violent-incident-report-notes", params.reportId],
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
    [violentIncidentReportMutation.mutate, params.reportId]
  );

  const downloadViolentIncidentReportToPdfMutation = useMutation({
    mutationFn: violentIncidentReportToPdf,
    onSuccess: (data) => {
      simulateDownload(new Blob([data]), "violent-incident-report.pdf");

      setTimeout(() => setInfo(), 2000);
    },
    onError: () => {
      setInfo();
    },
  });

  const violentIncidentReportActions: DropdownAction[] = useMemo(
    () => [
      {
        id: "edit",
        value: "Edit",
        action: () => setIsEditing(true),
        hidden: !canAlterViolentIncidentReport || isEditing,
      },
      {
        id: "pdf",
        value: "Download as PDF",
        action: () => {
          setInfo("Downloading as PDF...");
          downloadViolentIncidentReportToPdfMutation.mutate(
            violentIncidentReport?.id
          );
        },
        hidden: !violentIncidentReport,
      },
      ...Object.entries(ViolentIncidentReportStatus).map(([key, value]) => ({
        id: `status-${key}`,
        value: <StatusPill status={value} />,
        action: () => changeStatus(value),
        hidden: violentIncidentReport?.status === value,
      })),
    ],
    [
      changeStatus,
      violentIncidentReport,
      canAlterViolentIncidentReport,
      isEditing,
      setIsEditing,
      downloadViolentIncidentReportToPdfMutation,
      setInfo,
    ]
  );

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
    submission: DeepPartial<FormSubmission>
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
        <div className="flex justify-between items-end mb-4 sticky top-0 border-b bg-gray-50 border-gray-200 py-5 z-20">
          <Dropdown
            actions={violentIncidentReportActions}
            value="Actions"
            placement="bottom-start"
          />

          <div className="flex gap-4">
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
            {/* <span className="inline-flex items-center gap-1 text-sm font-medium">
              PoC files:
              <POCFilesButtonCompact
                pocFiles={violentIncidentReport.pocFiles}
                className="text-gray-500"
              />
            </span> */}
            <StatusPill status={violentIncidentReport.status} />
            <button
              type="button"
              onClick={() => setManageNotesOpen(true)}
              className="block self-start w-max rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
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
                className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
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
          queryKey={["violet-incident-report-notes", params.reportId]}
          notes={notes?.results}
        />
      </SlideOver>
    </>
  );
};

export default ViolentIncidentReportForm;

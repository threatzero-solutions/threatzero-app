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
import { THREAT_ASSESSMENT_FORM_SLUG } from "../../../constants/forms";
import { LEVEL, WRITE } from "../../../constants/permissions";
import { AlertContext } from "../../../contexts/alert/alert-context";
import { useAlertId } from "../../../contexts/alert/use-alert-id";
import { useAuth } from "../../../contexts/auth/useAuth";
import { API_BASE_URL } from "../../../contexts/core/constants";
import {
  addAssessmentNote,
  assessmentToPdf,
  getAssessmentNotes,
  getThreatAssessment,
  getThreatAssessmentForm,
  saveThreatAssessment,
} from "../../../queries/safety-management";
import { DeepPartial } from "../../../types/core";
import {
  AssessmentStatus,
  FormState,
  FormSubmission,
} from "../../../types/entities";
import { fromStatus, simulateDownload } from "../../../utils/core";

const ASSESSMENT_STATUS_OPTIONS: StatusOption<AssessmentStatus>[] = [
  {
    value: AssessmentStatus.IN_PROGRESS,
    label: fromStatus(AssessmentStatus.IN_PROGRESS),
    tone: "primary",
  },
  {
    value: AssessmentStatus.CONCLUDED_MANAGEMENT_ONGOING,
    label: fromStatus(AssessmentStatus.CONCLUDED_MANAGEMENT_ONGOING),
    tone: "secondary",
  },
  {
    value: AssessmentStatus.CONCLUDED_MANAGEMENT_COMPLETE,
    label: fromStatus(AssessmentStatus.CONCLUDED_MANAGEMENT_COMPLETE),
    tone: "success",
  },
];

const MEDIA_UPLOAD_URL = `${API_BASE_URL}/assessments/submissions/presigned-upload-urls`;

const ThreatAssessmentForm: React.FC = () => {
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
  const canAlterAssessment = useMemo(
    () => hasPermissions([WRITE.THREAT_ASSESSMENTS]),
    [hasPermissions],
  );

  const queryClient = useQueryClient();

  const { data: assessment } = useQuery({
    queryKey: ["assessment", params.assessmentId],
    queryFn: ({ queryKey }) => getThreatAssessment(queryKey[1]),
    enabled: !!params.assessmentId,
  });

  const { data: form, isLoading: formLoading } = useQuery({
    queryKey: ["threat-assessment-form", assessment?.submission.formId],
    queryFn: ({ queryKey }) =>
      getThreatAssessmentForm({ id: queryKey[1] ?? undefined }),
    enabled: !params.assessmentId || !!assessment,
  });

  const { data: notes } = useQuery({
    queryKey: ["assessment-notes", params.assessmentId],
    queryFn: ({ queryKey }) => getAssessmentNotes(queryKey[1], { limit: 50 }),
    enabled: !!params.assessmentId,
  });

  useEffect(() => {
    if (params.assessmentId === undefined) {
      setIsEditing(true);
    }
  }, [params.assessmentId, setIsEditing]);

  const assessmentMutation = useMutation({
    mutationFn: saveThreatAssessment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["assessment", params.assessmentId],
      });

      if (!params.assessmentId) {
        navigate(`../${data.id}?edit=true`);
      }
    },
  });

  const changeStatus = useCallback(
    (status: AssessmentStatus) => {
      const m = assessmentMutation.mutate;
      m({
        id: params.assessmentId,
        status,
      });
    },
    [assessmentMutation.mutate, params.assessmentId],
  );

  const downloadAssessmentAsPdfMutation = useMutation({
    mutationFn: assessmentToPdf,
    onSuccess: (data) => {
      simulateDownload(new Blob([data]), "assessment.pdf");

      setTimeout(() => clearAlert(infoAlertId), 2000);
    },
    onError: () => {
      clearAlert(infoAlertId);
    },
  });

  const downloadPdf = useCallback(() => {
    if (!assessment) return;
    setInfo("Downloading assessment as PDF...", { id: infoAlertId });
    downloadAssessmentAsPdfMutation.mutate(assessment.id);
  }, [assessment, downloadAssessmentAsPdfMutation, setInfo, infoAlertId]);

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
    submission: DeepPartial<FormSubmission>,
  ) => {
    event.preventDefault();

    assessmentMutation.mutate({
      id: params.assessmentId,
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
      {assessment && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mb-4 sticky top-0 border-b bg-gray-50 border-gray-200 py-5 z-20">
          <div className="flex items-center gap-3">
            <StatusBadgePicker
              value={assessment.status}
              options={ASSESSMENT_STATUS_OPTIONS}
              onChange={changeStatus}
              disabled={!canAlterAssessment}
              loading={assessmentMutation.isPending}
            />
            <span className="flex items-center gap-1 text-sm">
              <span className="font-medium">Tag:</span>
              <span className="italic">
                <EditableCell
                  value={assessment.tag}
                  onSave={(tag) =>
                    assessmentMutation.mutate({
                      id: assessment.id,
                      tag,
                    })
                  }
                  emptyValue="—"
                  readOnly={!canAlterAssessment}
                  alwaysShowEdit
                />
              </span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canAlterAssessment && !isEditing && (
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
              disabled={downloadAssessmentAsPdfMutation.isPending}
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
              ? "No threat assessment form has been published."
              : "No threat assessment form available."}
          </p>
          {canAlterForm && (
            <Link to={`/admin-panel/forms/${THREAT_ASSESSMENT_FORM_SLUG}`}>
              <button
                type="button"
                className="block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                {form ? "Edit Draft" : "+ Create Threat Assessment Form"}
              </button>
            </Link>
          )}
        </div>
      ) : (
        <Form
          form={form}
          isLoading={formLoading}
          onSubmit={handleSubmit}
          submission={assessment?.submission}
          readOnly={!canAlterAssessment || !isEditing}
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
              autoExecuteLoading: assessmentMutation.isPending,
            },
          ]}
          mediaUploadUrl={MEDIA_UPLOAD_URL}
        />
      )}
      <SlideOver open={manageNotesOpen} setOpen={setManageNotesOpen}>
        <ManageNotes
          setOpen={setManageNotesOpen}
          addNote={(n) => addAssessmentNote(params.assessmentId, n)}
          queryKey={["assessment-notes", params.assessmentId]}
          notes={notes?.results}
          mediaUploadUrl={MEDIA_UPLOAD_URL}
        />
      </SlideOver>
    </>
  );
};

export default ThreatAssessmentForm;

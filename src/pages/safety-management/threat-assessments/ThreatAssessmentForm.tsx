import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addAssessmentNote,
  assessmentToPdf,
  getAssessmentNotes,
  getThreatAssessment,
  getThreatAssessmentForm,
  saveThreatAssessment,
} from "../../../queries/safety-management";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  AssessmentStatus,
  FormState,
  FormSubmission,
} from "../../../types/entities";
import Form from "../../../components/forms/Form";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import StatusPill from "./components/StatusPill";
import { LEVEL, WRITE } from "../../../constants/permissions";
import { THREAT_ASSESSMENT_FORM_SLUG } from "../../../constants/forms";
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

const MEDIA_UPLOAD_URL = `${API_BASE_URL}/assessments/submissions/presigned-upload-urls`;

const ThreatAssessmentForm: React.FC = () => {
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
  const canAlterAssessment = useMemo(
    () => hasPermissions([WRITE.THREAT_ASSESSMENTS]),
    [hasPermissions]
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
    [assessmentMutation.mutate, params.assessmentId]
  );

  const downloadAssessmentAsPdfMutation = useMutation({
    mutationFn: assessmentToPdf,
    onSuccess: (data) => {
      simulateDownload(new Blob([data]), "assessment.pdf");

      setTimeout(() => setInfo(), 2000);
    },
    onError: () => {
      setInfo();
    },
  });

  const assessmentActions: DropdownAction[] = useMemo(
    () => [
      {
        id: "edit",
        value: "Edit",
        action: () => setIsEditing(true),
        hidden: !canAlterAssessment || isEditing,
      },
      {
        id: "pdf",
        value: "Download as PDF",
        action: () => {
          setInfo("Downloading assessment as PDF...");
          downloadAssessmentAsPdfMutation.mutate(assessment?.id);
        },
        hidden: !assessment,
      },
      ...Object.entries(AssessmentStatus).map(([key, value]) => ({
        id: `status-${key}`,
        value: <StatusPill status={value} />,
        action: () => changeStatus(value),
        hidden: assessment?.status === value,
      })),
    ],
    [
      changeStatus,
      assessment,
      canAlterAssessment,
      isEditing,
      setIsEditing,
      downloadAssessmentAsPdfMutation,
      setInfo,
    ]
  );

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
    submission: DeepPartial<FormSubmission>
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
        <div className="flex justify-between items-end mb-4 sticky top-0 border-b bg-gray-50 border-gray-200 py-5 z-20">
          <Dropdown
            actions={assessmentActions}
            value="Actions"
            placement="bottom-start"
          />

          <div className="flex gap-4">
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
            {/* <span className="inline-flex items-center gap-1 text-sm font-medium">
              PoC files:
              <POCFilesButtonCompact
                pocFiles={assessment.pocFiles}
                className="text-gray-500"
              />
            </span> */}
            <StatusPill status={assessment.status} />
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
              ? "No threat assessment form has been published."
              : "No threat assessment form available."}
          </p>
          {canAlterForm && (
            <Link to={`/admin-panel/forms/${THREAT_ASSESSMENT_FORM_SLUG}`}>
              <button
                type="button"
                className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
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
        />
      </SlideOver>
    </>
  );
};

export default ThreatAssessmentForm;

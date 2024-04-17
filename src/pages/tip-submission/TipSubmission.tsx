import { useMutation, useQuery } from "@tanstack/react-query";
import {
  SubmitTipInput,
  addTipNote,
  getTipForm,
  getTipNotes,
  getTipSubmission,
  saveTip,
  submitTip,
} from "../../queries/safety-management";
import Form from "../../components/forms/Form";
import { FormState, FormSubmission, TipStatus } from "../../types/entities";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useCallback, useContext, useMemo, useState } from "react";
import { TIP_SUBMISSION_FORM_SLUG } from "../../constants/forms";
import { LEVEL, READ, WRITE } from "../../constants/permissions";
import { CoreContext } from "../../contexts/core/core-context";
import Dropdown, { DropdownAction } from "../../components/layouts/Dropdown";
import StatusPill from "./components/StatusPill";
import SlideOver from "../../components/layouts/SlideOver";
import ManageNotes from "../../components/notes/ManageNotes";
import { API_BASE_URL } from "../../contexts/core/constants";
import BackButton from "../../components/layouts/BackButton";
import EditableCell from "../../components/layouts/EditableCell";

const MEDIA_UPLOAD_URL = `${API_BASE_URL}/tips/submissions/presigned-upload-urls`;

const TipSubmission: React.FC = () => {
  const [manageNotesOpen, setManageNotesOpen] = useState(false);

  const { data: form, isLoading: formLoading } = useQuery({
    queryKey: ["tip-form"],
    queryFn: () => getTipForm(),
  });
  const [searchParams] = useSearchParams();
  const params = useParams();
  const { hasPermissions } = useContext(CoreContext);
  const navigate = useNavigate();

  const canAlterForm = useMemo(
    () => hasPermissions([LEVEL.ADMIN, WRITE.FORMS]),
    [hasPermissions]
  );

  const canReadTip = useMemo(
    () => hasPermissions([READ.TIPS]),
    [hasPermissions]
  );

  const canAlterTip = useMemo(
    () => hasPermissions([WRITE.TIPS]),
    [hasPermissions]
  );

  const { data: tip, refetch: refetchTip } = useQuery({
    queryKey: ["tip", params.tipId],
    queryFn: ({ queryKey }) =>
      getTipSubmission(queryKey[1] as string).catch(() => null),
    enabled: canReadTip,
  });

  const { data: notes } = useQuery({
    queryKey: ["tip-notes", params.tipId],
    queryFn: ({ queryKey }) => getTipNotes(queryKey[1], { limit: 50 }),
    enabled: !!params.tipId,
  });

  const submitTipMutation = useMutation({
    mutationFn: (value: { tip: SubmitTipInput; locationId?: string }) =>
      submitTip(value.tip, value.locationId),
    onSuccess: () => {
      navigate("./success");
    },
  });

  const saveTipMutation = useMutation({
    mutationFn: saveTip,
    onSuccess: () => {
      refetchTip();
    },
  });

  const changeStatus = useCallback(
    (status: TipStatus) => {
      if (!params.tipId) {
        return;
      }

      const m = saveTipMutation.mutate;
      m({
        id: params.tipId,
        status,
      });
    },
    [saveTipMutation.mutate, params.tipId]
  );

  const tipActions: DropdownAction[] = useMemo(
    () => [
      {
        id: "mark-new",
        value: "Mark As New",
        action: () => changeStatus(TipStatus.NEW),
        hidden: tip?.status === TipStatus.NEW,
      },
      {
        id: "mark-reviewed",
        value: "Mark As Reviewed",
        action: () => changeStatus(TipStatus.REVIEWED),
        hidden: tip?.status === TipStatus.REVIEWED,
      },
      {
        id: "mark-resolved",
        value: "Mark as Resolved",
        action: () => changeStatus(TipStatus.RESOLVED),
        hidden: tip?.status === TipStatus.RESOLVED,
      },
    ],
    [changeStatus, tip?.status]
  );

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
    submission: Partial<FormSubmission>
  ) => {
    event.preventDefault();

    const locationId = searchParams.get("loc_id");
    // TODO: Submit form, but also handle file uploads somehow.
    submitTipMutation.mutate({
      tip: {
        submission,
      },
      locationId: locationId ?? undefined,
    });
  };

  return (
    <>
      {tip && <BackButton defaultTo="../" valueOnDefault="Back to Dashboard" />}
      {tip && canAlterTip && (
        <div className="flex justify-between items-end mb-4">
          <Dropdown actions={tipActions} value="Actions" openTo="right" />

          <div className="flex gap-4">
            <span className="flex items-center gap-1 text-sm">
              <span className="font-medium">Tag:</span>
              <span className="italic">
                <EditableCell
                  value={tip.tag}
                  onSave={(tag) =>
                    saveTipMutation.mutate({
                      id: tip.id,
                      tag,
                    })
                  }
                  emptyValue="—"
                  readOnly={!canAlterTip}
                  alwaysShowEdit
                />
              </span>
            </span>
            {/* <span className="inline-flex items-center gap-1 text-sm font-medium">
              PoC files:
              <POCFilesButtonCompact
                pocFiles={tip.pocFiles}
                className="text-gray-500"
              />
            </span> */}
            <StatusPill status={tip.status} />
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
            No safety concern form{" "}
            {form && canAlterForm ? "has been published." : "is available."}
          </p>
          {canAlterForm && (
            <Link to={`/admin-panel/forms/${TIP_SUBMISSION_FORM_SLUG}`}>
              <button
                type="button"
                className="block rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
              >
                {form ? "Edit Draft" : "+ Create Safety Concern Form"}
              </button>
            </Link>
          )}
        </div>
      ) : (
        <Form
          form={form}
          isLoading={formLoading}
          submission={tip?.submission}
          readOnly={!!tip?.submission}
          onSubmit={handleSubmit}
          mediaUploadUrl={`${MEDIA_UPLOAD_URL}${
            searchParams.has("loc_id")
              ? `?locationId=${searchParams.get("loc_id")}`
              : ""
          }`}
        />
      )}
      <SlideOver open={manageNotesOpen} setOpen={setManageNotesOpen}>
        <ManageNotes
          setOpen={setManageNotesOpen}
          addNote={(n) => addTipNote(params.tipId, n)}
          queryKey={["tip-notes", params.tipId]}
          notes={notes?.results}
        />
      </SlideOver>
    </>
  );
};

export default TipSubmission;

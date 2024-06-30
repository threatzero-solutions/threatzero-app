import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Field, FieldType, OpaqueToken } from "../../../../types/entities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTrainingToken } from "../../../../queries/users";
import SlideOverHeading from "../../../../components/layouts/slide-over/SlideOverHeading";
import FormInput from "../../../../components/forms/inputs/FormInput";
import { SimpleChangeEvent } from "../../../../types/core";
import { orderSort } from "../../../../utils/core";
import SlideOverForm from "../../../../components/layouts/slide-over/SlideOverForm";
import SlideOverField from "../../../../components/layouts/slide-over/SlideOverField";
import SlideOverFormBody from "../../../../components/layouts/slide-over/SlideOverFormBody";
import { getTrainingItem } from "../../../../queries/training";
import TrainingItemTile from "../../../training-library/components/TrainingItemTile";
import SlideOver from "../../../../components/layouts/slide-over/SlideOver";
import ManageItems from "../../../training-library/components/ManageItems";

const INPUT_DATA: Array<Partial<Field>> = [
  {
    name: "email",
    label: "Email Address",
    helpText: "The email address of the user being granted access.",
    type: FieldType.TEXT,
    required: true,
    order: 0,
  },
  {
    name: "userId",
    label: "User ID",
    helpText: "Unique user identifier. Typically the user's email address.",
    type: FieldType.TEXT,
    required: true,
    order: 1,
  },
  {
    name: "expiresOn",
    label: "Expires On",
    helpText:
      "The date on which the invite expires and access is revoked automatically.",
    type: FieldType.DATE,
    required: true,
    order: 2,
  },
  {
    name: "trainingItemId",
    label: "Training Item",
    helpText:
      "The training item the user will have access to. The generated link will direct user to watch this item.",
    type: FieldType.NONE,
    required: true,
    order: 3,
  },
];

interface ManageTrainingInviteProps {
  setOpen: (open: boolean) => void;
  trainingToken?: Partial<OpaqueToken>;
  readOnly?: boolean;
}

const ManageTrainingInvite: React.FC<ManageTrainingInviteProps> = ({
  setOpen,
  trainingToken: trainingTokenProp,
  readOnly,
}) => {
  const [trainingTokenValue, setTrainingTokenValue] = useState<
    Record<string, unknown>
  >({});
  const [selectItemOpen, setSelectItemOpen] = useState(false);
  const [userIdAsEmail, setUserIdAsEmail] = useState(true);

  useEffect(() => {
    setTrainingTokenValue((v) => ({
      ...v,
      ...(trainingTokenProp?.value ?? {}),
    }));
  }, [trainingTokenProp]);

  useEffect(() => {
    if (userIdAsEmail) {
      setTrainingTokenValue((v) => ({
        ...v,
        userId: trainingTokenValue.email,
      }));
    }
  }, [userIdAsEmail, trainingTokenValue.email]);

  const { data: trainingItem, isLoading: trainingItemLoading } = useQuery({
    queryKey: ["training-items", trainingTokenValue.trainingItemId] as const,
    queryFn: ({ queryKey }) => getTrainingItem(`${queryKey[1]}`),
    enabled: !!trainingTokenValue.trainingItemId,
  });

  const queryClient = useQueryClient();
  const createTrainingTokenMutation = useMutation({
    mutationFn: createTrainingToken,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["training-tokens"],
      });
      setOpen(false);
    },
  });

  const handleChange = (event: SimpleChangeEvent<unknown>) => {
    setTrainingTokenValue((v) =>
      event.target
        ? {
            ...v,
            [event.target.name]: event.target.value,
          }
        : v
    );
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (readOnly) return;

    createTrainingTokenMutation.mutate(trainingTokenValue);
  };

  return (
    <>
      <SlideOverForm
        onSubmit={handleSubmit}
        onClose={() => setOpen(false)}
        submitText="Create"
        readOnly={readOnly}
      >
        <SlideOverHeading
          title={readOnly ? "View Training Invite" : "Create Training Invite"}
          description=""
          setOpen={setOpen}
        />

        {/* Divider container */}
        <SlideOverFormBody>
          {INPUT_DATA.sort(orderSort).map((input) => (
            <SlideOverField
              key={input.id ?? input.name}
              label={input.label}
              name={input.name}
              helpText={input.helpText}
            >
              {input.name === "trainingItemId" ? (
                trainingItemLoading ? (
                  <div className="animate-pulse rounded-lg bg-slate-200 px-4 py-5 shadow sm:p-6"></div>
                ) : trainingItem ? (
                  <div className="space-y-4 mb-4">
                    <TrainingItemTile
                      item={trainingItem}
                      dense={true}
                      navigateDisabled={true}
                      className="shadow-lg"
                    />
                    {!readOnly && (
                      <button
                        type="button"
                        className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        onClick={() => setSelectItemOpen(true)}
                      >
                        Change training item
                      </button>
                    )}
                  </div>
                ) : readOnly ? (
                  <p className="text-sm">No training item.</p>
                ) : (
                  <button
                    type="button"
                    className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    onClick={() => setSelectItemOpen(true)}
                  >
                    Select a training item
                  </button>
                )
              ) : (
                <div className="space-y-4">
                  {input.name === "userId" && (
                    <label className="inline-flex gap-2 items-center text-sm">
                      <FormInput
                        field={{
                          name: "userId_as_email",
                          type: FieldType.CHECKBOX,
                        }}
                        checked={
                          readOnly
                            ? trainingTokenValue.email ===
                              trainingTokenValue.userId
                            : userIdAsEmail
                        }
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setUserIdAsEmail(e.target.checked)
                        }
                        readOnly={readOnly}
                      />
                      Use email for user ID
                    </label>
                  )}
                  <FormInput
                    field={input}
                    onChange={handleChange}
                    disabled={input.name === "userId" && userIdAsEmail}
                    value={trainingTokenValue[input.name as keyof object] ?? ""}
                    readOnly={readOnly}
                  />
                </div>
              )}
            </SlideOverField>
          ))}
        </SlideOverFormBody>
        <SlideOver open={selectItemOpen} setOpen={setSelectItemOpen}>
          <ManageItems
            setOpen={setSelectItemOpen}
            isSelecting={true}
            multiple={false}
            onConfirmSelection={(selection) =>
              selection.length &&
              setTrainingTokenValue((v) => ({
                ...v,
                trainingItemId: selection[0]?.id,
              }))
            }
            existingItemSelection={trainingItem ? [trainingItem] : []}
          />
        </SlideOver>
      </SlideOverForm>
    </>
  );
};

export default ManageTrainingInvite;

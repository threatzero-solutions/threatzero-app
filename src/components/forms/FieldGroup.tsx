import { ChangeEvent, useContext, useMemo } from "react";
import { FormsContext } from "../../contexts/forms/forms-context";
import {
  FieldGroup as FieldGroupEntity,
  FieldResponse,
} from "../../types/entities";
import { classNames, noMutateSort, orderSort } from "../../utils/core";
import FormField from "./FormField";
import AddNew from "./builder/AddNew";

interface FormGroupProps {
  group: FieldGroupEntity;
  isBuilding?: boolean;
  onFieldChange?: (event: Partial<ChangeEvent<any>>) => void;
  fieldResponses: {
    [key: string]: FieldResponse;
  };
  readOnly?: boolean;
  orientation?: "vertical" | "horizontal";
  className?: string;
  isSubgroup?: boolean;
  hideTitle?: boolean;
  mediaUploadUrl: string;
}

const FieldGroup: React.FC<FormGroupProps> = ({
  group,
  isBuilding,
  onFieldChange,
  fieldResponses,
  readOnly,
  orientation,
  className,
  isSubgroup,
  hideTitle,
  mediaUploadUrl,
}) => {
  const { handleEditFieldGroup, handleEditField } = useContext(FormsContext);
  const subgroups = useMemo(
    () => noMutateSort(group.childGroups, orderSort),
    [group]
  );

  return (
    <>
      <div
        className={classNames(
          "grid grid-cols-1 gap-x-8 gap-y-4 pb-12 auto-rows-min",
          orientation === "vertical" ? "" : "md:grid-cols-3",
          isSubgroup ? "col-span-full" : "",
          className
        )}
      >
        <div>
          {!hideTitle && group.title && (
            <h2
              className={classNames(
                "font-semibold",
                isSubgroup
                  ? "text-base text-gray-800 leading-6"
                  : "text-xl text-gray-900 leading-7"
              )}
              dangerouslySetInnerHTML={{ __html: group.title ?? "" }}
            ></h2>
          )}
          {!hideTitle && group.subtitle && (
            <h3
              className="text-base leading-6 text-gray-600"
              dangerouslySetInnerHTML={{ __html: group.subtitle }}
            ></h3>
          )}
          {group.description && (
            <p
              className="mt-1 text-sm leading-6 text-gray-600"
              dangerouslySetInnerHTML={{
                __html: group.description ?? "",
              }}
            ></p>
          )}
          {isBuilding && (
            <button
              onClick={() => handleEditFieldGroup(group)}
              className="text-secondary-600 hover:text-secondary-900"
            >
              Edit
            </button>
          )}
        </div>

        <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
          {/* FIELDS NOT IN SUBGROUP */}
          {noMutateSort(group.fields, orderSort)?.map((field, idx) => (
            <FormField
              key={group.id + "_group_field_" + idx}
              field={field}
              value={fieldResponses[field.id]?.value ?? ""}
              loadedValue={fieldResponses[field.id]?.loadedValue}
              readOnly={readOnly}
              onChange={onFieldChange}
              onEdit={
                isBuilding
                  ? () => handleEditField({ ...field, group })
                  : undefined
              }
              mediaUploadUrl={mediaUploadUrl}
            />
          ))}
          {isBuilding &&
            (!group.fields?.length ? (
              <AddNew
                contentName="field"
                pluralContentName="fields"
                onAdd={() =>
                  handleEditField({
                    group,
                  })
                }
              />
            ) : (
              <button
                onClick={() => handleEditField({ group })}
                className="block self-start w-max rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-secondary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
              >
                + Add Field
              </button>
            ))}

          {/* SUBGROUPS */}
          {subgroups?.map((childGroup, idx) => (
            <FieldGroup
              key={group.id + "_child_group_" + idx}
              group={childGroup}
              isBuilding={isBuilding}
              onFieldChange={onFieldChange}
              fieldResponses={fieldResponses}
              readOnly={readOnly}
              orientation={"vertical"}
              isSubgroup={true}
              className={classNames(
                idx !== subgroups.length + 1
                  ? "border-b border-gray-900/10"
                  : ""
              )}
              mediaUploadUrl={mediaUploadUrl}
            />
          ))}

          {/* Only permit subgroups one level deep. */}
          {isBuilding &&
            !isSubgroup &&
            (!group.childGroups?.length ? (
              <AddNew
                contentName="subgroup"
                pluralContentName="subgroups"
                onAdd={() =>
                  handleEditFieldGroup({
                    parentGroup: group,
                  })
                }
              />
            ) : (
              <button
                onClick={() =>
                  handleEditFieldGroup({
                    parentGroup: group,
                  })
                }
                className="block self-start w-max rounded-md bg-secondary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-secondary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
              >
                + Add Subgroup
              </button>
            ))}
        </div>
      </div>
    </>
  );
};

export default FieldGroup;

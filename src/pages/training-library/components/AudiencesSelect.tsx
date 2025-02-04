import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Label,
} from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import React, { useContext, useMemo, useState } from "react";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import PillBadge from "../../../components/PillBadge";
import { useAuth } from "../../../contexts/auth/useAuth";
import { TrainingContext } from "../../../contexts/training/training-context";
import { getTrainingAudiences } from "../../../queries/training";
import { SimpleChangeEvent } from "../../../types/core";
import { Audience } from "../../../types/entities";
import { classNames, humanizeSlug } from "../../../utils/core";
import ViewTrainingAudiences from "./ViewTrainingAudiences";

interface AudiencesSelectProps {
  value?: Audience[];
  onChange?: (event: SimpleChangeEvent<Audience[]>) => void;
  disabled?: boolean;
  name?: string;
  label?: string;
  required?: boolean;
  propertyNameSingular?: string;
  propertyNamePlural?: string;
  allowedAudiences?: Audience[];
}

const AudiencesSelect: React.FC<AudiencesSelectProps> = ({
  value,
  onChange,
  disabled = false,
  name,
  label,
  required = false,
  propertyNameSingular = "audience",
  propertyNamePlural = "audiences",
  allowedAudiences,
}) => {
  const [audienceQuery, setAudienceQuery] = useState("");
  const [viewAudiencesSliderOpen, setViewAudiencesSliderOpen] = useState(false);

  const { isGlobalAdmin } = useAuth();
  const { dispatch } = useContext(TrainingContext);

  const { data: audienceData } = useQuery({
    queryKey: ["training-audiences"],
    queryFn: () => getTrainingAudiences({ limit: 100 }),
    enabled: !allowedAudiences,
  });
  const audiences = useMemo(
    () =>
      (allowedAudiences ?? audienceData?.results)?.filter(
        (a) =>
          !value?.some((ca) => ca.slug === a.slug) &&
          (!audienceQuery ||
            a.slug.toLowerCase().includes(audienceQuery.toLowerCase()))
      ),
    [allowedAudiences, audienceData, audienceQuery, value]
  );

  const handleChange = (audiences: Audience[]) => {
    onChange?.({
      type: "change",
      target: { name: name ?? "audiences", value: audiences },
    });
  };

  const handleAddAudience = (audience: Audience) => {
    if (!audience) return;
    handleChange([...(value ?? []), audience]);
  };

  const handleRemoveAudience = (audience: Audience) => {
    if (!audience) return;
    handleChange(value?.filter((a) => a.slug !== audience.slug) ?? []);
  };

  const handleEditAudience = (audience?: Audience) => {
    dispatch({
      type: "SET_ACTIVE_AUDIENCE",
      payload: audience,
    });
    dispatch({
      type: "SET_EDIT_AUDIENCE_SLIDER_OPEN",
      payload: true,
    });
  };

  return (
    <>
      <div>
        <Combobox as="div" onChange={handleAddAudience} disabled={disabled}>
          {label && (
            <Label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
              {label}
            </Label>
          )}
          <div className="relative">
            <ComboboxInput
              className="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-secondary-600 sm:text-sm sm:leading-6"
              onChange={(event) => setAudienceQuery(event.target.value)}
              placeholder={`Search ${propertyNamePlural}...`}
              displayValue={() => ""}
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-hidden">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </ComboboxButton>

            <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-hidden sm:text-sm">
              {(isGlobalAdmin || audiences?.length === 0) && (
                <ComboboxOption
                  value={null}
                  disabled={true}
                  className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-500"
                >
                  {isGlobalAdmin ? (
                    <button
                      onClick={() => handleEditAudience()}
                      type="button"
                      className="block capitalize w-max rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-secondary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
                    >
                      + Create New {propertyNameSingular}
                    </button>
                  ) : (
                    (!audiences || audiences.length === 0) && (
                      <span>No {propertyNamePlural} found.</span>
                    )
                  )}
                </ComboboxOption>
              )}
              {audiences &&
                audiences.length > 0 &&
                audiences.map((audience) => (
                  <ComboboxOption
                    key={audience.id}
                    value={audience}
                    className={({ focus }) =>
                      classNames(
                        "relative cursor-default select-none py-2 pl-3 pr-9",
                        focus ? "bg-secondary-600 text-white" : "text-gray-900"
                      )
                    }
                  >
                    {
                      <span className="block truncate">
                        {humanizeSlug(audience.slug)}
                      </span>
                    }
                  </ComboboxOption>
                ))}
            </ComboboxOptions>
          </div>
        </Combobox>
        <div className="flex justify-between mt-3">
          <div className="flex gap-2 flex-wrap">
            {value && value.length > 0
              ? value.map((a) => (
                  <PillBadge
                    key={a.id}
                    value={a}
                    displayValue={humanizeSlug(a.slug)}
                    color={disabled ? "gray" : "blue"}
                    isRemovable={true}
                    onRemove={() => handleRemoveAudience(a)}
                    disabled={disabled}
                  />
                ))
              : required && (
                  <span className="text-sm text-gray-400 italic">
                    Please select at least one {propertyNameSingular}.
                  </span>
                )}
          </div>
          {isGlobalAdmin && (
            <button
              type="button"
              onClick={() => setViewAudiencesSliderOpen(true)}
              className="text-secondary-600 disabled:text-gray-500 enabled:hover:text-secondary-900 text-sm shrink-0"
              disabled={disabled}
            >
              Manage {propertyNamePlural}
            </button>
          )}
        </div>
      </div>
      <SlideOver
        open={viewAudiencesSliderOpen}
        setOpen={setViewAudiencesSliderOpen}
      >
        <ViewTrainingAudiences setOpen={setViewAudiencesSliderOpen} />
      </SlideOver>
    </>
  );
};

export default AudiencesSelect;

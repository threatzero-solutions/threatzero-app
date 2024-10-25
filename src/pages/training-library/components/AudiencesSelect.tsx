import { Combobox } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/24/outline";
import { Audience } from "../../../types/entities";
import { getTrainingAudiences } from "../../../queries/training";
import React, { useContext, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PillBadge from "../../../components/PillBadge";
import { TrainingContext } from "../../../contexts/training/training-context";
import { classNames, humanizeSlug } from "../../../utils/core";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import ViewTrainingAudiences from "./ViewTrainingAudiences";
import { SimpleChangeEvent } from "../../../types/core";

interface AudiencesSelectProps {
  value?: Audience[];
  onChange?: (event: SimpleChangeEvent<Audience[]>) => void;
  name?: string;
  label?: string;
  required?: boolean;
}

const AudiencesSelect: React.FC<AudiencesSelectProps> = ({
  value,
  onChange,
  name,
  label,
  required = false,
}) => {
  const [audienceQuery, setAudienceQuery] = useState("");
  const [viewAudiencesSliderOpen, setViewAudiencesSliderOpen] = useState(false);

  const { dispatch } = useContext(TrainingContext);

  const { data: audienceData } = useQuery({
    queryKey: ["training-audiences"],
    queryFn: () => getTrainingAudiences({ limit: 100 }),
  });
  const audiences = useMemo(
    () =>
      audienceData?.results.filter(
        (a) =>
          !value?.some((ca) => ca.slug === a.slug) &&
          (!audienceQuery ||
            a.slug.toLowerCase().includes(audienceQuery.toLowerCase()))
      ),
    [audienceData, audienceQuery, value]
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
        <Combobox as="div" onChange={handleAddAudience}>
          {label && (
            <Combobox.Label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
              {label}
            </Combobox.Label>
          )}
          <div className="relative">
            <Combobox.Input
              className="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-secondary-600 sm:text-sm sm:leading-6"
              onChange={(event) => setAudienceQuery(event.target.value)}
              placeholder="Search audiences..."
              displayValue={() => ""}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </Combobox.Button>

            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              <Combobox.Option
                value={null}
                disabled={true}
                className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-500"
              >
                <button
                  onClick={() => handleEditAudience()}
                  type="button"
                  className="block w-max rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
                >
                  + Create New Audience
                </button>
              </Combobox.Option>
              {audiences &&
                audiences.length > 0 &&
                audiences.map((audience) => (
                  <Combobox.Option
                    key={audience.id}
                    value={audience}
                    className={({ active }) =>
                      classNames(
                        "relative cursor-default select-none py-2 pl-3 pr-9",
                        active ? "bg-secondary-600 text-white" : "text-gray-900"
                      )
                    }
                  >
                    {
                      <span className="block truncate">
                        {humanizeSlug(audience.slug)}
                      </span>
                    }
                  </Combobox.Option>
                ))}
            </Combobox.Options>
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
                    color="blue"
                    isRemovable={true}
                    onRemove={() => handleRemoveAudience(a)}
                  />
                ))
              : required && (
                  <span className="text-sm text-gray-400 italic">
                    Please select at least one audience
                  </span>
                )}
          </div>
          <button
            type="button"
            onClick={() => setViewAudiencesSliderOpen(true)}
            className="text-secondary-600 hover:text-secondary-900 text-sm shrink-0"
          >
            Manage audiences
          </button>
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

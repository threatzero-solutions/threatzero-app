import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import SlideOver from "../../../components/layouts/slide-over/SlideOver";
import { getTrainingAudiences } from "../../../queries/training";
import { Audience } from "../../../types/entities";
import { humanizeSlug } from "../../../utils/core";
import EditTrainingAudience from "./EditTrainingAudience";

interface ViewTrainingAudiencesProps {
  setOpen: (open: boolean) => void;
}

const ViewTrainingAudiences: React.FC<ViewTrainingAudiencesProps> = ({
  setOpen,
}) => {
  const [editAudienceOpen, setEditAudienceOpen] = useState(false);
  const [audienceEditing, setAudienceEditing] = useState<Audience>();

  const { data: audiences } = useQuery({
    queryKey: ["training-audiences"],
    queryFn: getTrainingAudiences,
  });

  const handleManageAudience = (audience?: Audience) => {
    setAudienceEditing(audience);
    setEditAudienceOpen(true);
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex-1">
          {/* HEADER */}
          <div className="bg-gray-50 px-4 py-6 sm:px-6">
            <div className="flex items-start justify-between space-x-3">
              <div className="space-y-1">
                <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                  All Audiences
                </Dialog.Title>
                <p className="text-sm text-gray-500">
                  Select an audience to manage
                </p>
              </div>
              <div className="flex h-7 items-center">
                <button
                  type="button"
                  className="relative text-gray-400 hover:text-gray-500"
                  onClick={() => setOpen(false)}
                >
                  <span className="absolute -inset-2.5" />
                  <span className="sr-only">Close panel</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* COURSES */}
          <ul className="divide-y divide-gray-100">
            {audiences &&
              audiences.results.map((audience) => (
                <li
                  key={audience.id}
                  className="relative flex justify-between gap-x-6 px-4 py-5 sm:px-6 lg:px-8"
                >
                  <div className="flex min-w-0 gap-x-4">
                    <div className="min-w-0 flex-auto">
                      <p className="text-sm font-semibold leading-6 text-gray-900">
                        {humanizeSlug(audience.slug)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-x-4">
                    <button
                      type="button"
                      onClick={() => handleManageAudience(audience)}
                      className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      Manage
                      <span className="sr-only">, {audience.slug}</span>
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </div>

        {/* Action buttons */}
        <div className="shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="flex space-x-3">
            <div className="grow"></div>
            <button
              type="button"
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleManageAudience()}
              className="inline-flex justify-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-secondary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600"
            >
              + Create New Audience
            </button>
          </div>
        </div>
      </div>
      <SlideOver open={editAudienceOpen} setOpen={setEditAudienceOpen}>
        <EditTrainingAudience
          setOpen={setEditAudienceOpen}
          audience={audienceEditing}
        />
      </SlideOver>
    </>
  );
};

export default ViewTrainingAudiences;

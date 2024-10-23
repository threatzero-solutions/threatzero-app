import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import { TrainingSection } from "../../../types/entities";
import {
  Fragment,
  KeyboardEvent,
  MouseEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  EllipsisVerticalIcon,
  Square3Stack3DIcon,
} from "@heroicons/react/24/outline";
import { classNames } from "../../../utils/core";
import { Menu, Transition } from "@headlessui/react";

dayjs.extend(duration);
dayjs.extend(relativeTime);

interface TrainingSectionTileProps {
  section: Partial<TrainingSection>;
  className?: string;
  onEditSection?: (section?: Partial<TrainingSection>) => void;
  navigateDisabled?: boolean;
}

const TrainingSectionTile: React.FC<TrainingSectionTileProps> = ({
  section,
  className,
  onEditSection,
  navigateDisabled: navigateDisabledProp,
}) => {
  const location = useLocation();

  const firstItem = useMemo(() => section.items?.[0]?.item, [section.items]);
  const singleItem = useMemo(
    () => section.items?.length === 1,
    [section.items]
  );
  const [isHover, setIsHover] = useState(false);

  const navigate = useNavigate();

  const navigateDisabled = useMemo(
    () => navigateDisabledProp || !!onEditSection,
    [navigateDisabledProp, onEditSection]
  );

  const availability = useMemo(() => {
    const defaultFormat = "MMM D, YYYY";

    const availableOn = dayjs(section.availableOn);
    const expiresOn = section.expiresOn ? dayjs(section.expiresOn) : null;

    if (!expiresOn) {
      return availableOn.format(defaultFormat);
    }

    if (availableOn.isSame(expiresOn, "year")) {
      const yearSuffix = `, ${expiresOn.format("YYYY")}`;
      if (availableOn.isSame(expiresOn, "month")) {
        return `${availableOn.format("MMM D")} - ${expiresOn.format(
          "D"
        )}${yearSuffix}`;
      }
      return `${availableOn.format("MMM D")} - ${expiresOn.format(
        "MMM D"
      )}${yearSuffix}`;
    }

    return `${availableOn.format(defaultFormat)} - ${expiresOn.format(
      defaultFormat
    )}`;
  }, [section]);

  const navigateToSection = useCallback(
    (e: MouseEvent | KeyboardEvent) => {
      if (e.type === "keyup" && (e as KeyboardEvent).key !== "Enter") {
        return;
      }

      if (navigateDisabled) {
        return;
      }

      navigate(`/training/library/sections/${section.id}`, {
        state: { from: location },
      });
    },
    [location, navigate, section.id, navigateDisabled]
  );

  return (
    <div
      className={classNames(
        "relative",
        !navigateDisabled ? "cursor-pointer" : ""
      )}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      onClick={navigateToSection}
      onKeyUp={navigateToSection}
    >
      <div
        className={classNames(
          "col-span-1 grid grid-cols-video-card rounded-md overflow-hidden grid-rows-video-card h-full",
          className
        )}
      >
        <div className={"flex pt-64 overflow-hidden relative"}>
          <img
            className={classNames(
              isHover && !navigateDisabled
                ? "w-[105%] h-[105%]"
                : "w-full h-full",
              "absolute object-cover transition-all duration-300 ease-out inset-0"
            )}
            src={firstItem?.thumbnailUrl ?? undefined}
            alt=""
          />
        </div>
        <div className="flex flex-col min-w-32 justify-between px-6 py-4 text-sm bg-white">
          <div>
            <p className="text-gray-500 text-xs">{availability}</p>
            <h2
              className="text-lg my-1"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: input controlled by Admins
              dangerouslySetInnerHTML={{
                __html:
                  (singleItem
                    ? firstItem?.metadata.title
                    : section.metadata?.title) ?? "",
              }}
            />
            <p
              className="text-gray-500 text-md line-clamp-5"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: input controlled by Admins
              dangerouslySetInnerHTML={{
                __html:
                  (singleItem
                    ? firstItem?.metadata.description
                    : section.metadata?.description) ?? "",
              }}
            />
          </div>
          <div className="flex items-center mt-6">
            <p className="text-gray-500 text-xs">
              {singleItem ? (
                <span>
                  {firstItem?.estCompletionTime
                    ? dayjs.duration(firstItem.estCompletionTime).humanize()
                    : ""}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Square3Stack3DIcon className="h-5 w-5 text-gray-400" />
                  {section.items?.length || 0} items
                </span>
              )}
            </p>
            <div className="grow" />
            {onEditSection && (
              <Menu as="div">
                <Menu.Button className="block p-2.5 text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Open options</span>
                  <EllipsisVerticalIcon
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-6 z-10 mt-0.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          type="button"
                          onClick={() => onEditSection(section)}
                          className={classNames(
                            active ? "bg-gray-50" : "",
                            "block w-full px-3 py-1 text-sm leading-6 text-gray-900"
                          )}
                        >
                          Edit
                          <span className="sr-only">
                            , {section.metadata?.title}
                          </span>
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingSectionTile;

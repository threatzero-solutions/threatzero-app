import React, {
  createContext,
  Dispatch,
  PropsWithChildren,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import {
  Audience,
  TrainingCourse,
  TrainingSection,
} from "../../types/entities";
import SlideOver from "../../components/layouts/slide-over/SlideOver";
import ViewCourses from "../../pages/training-library/components/ViewCourses";
import ViewTrainingAudiences from "../../pages/training-library/components/ViewTrainingAudiences";
import { useQuery } from "@tanstack/react-query";
import { getTrainingCourse, getTrainingCourses } from "../../queries/training";
import EditTrainingSection from "../../pages/training-library/components/EditTrainingSection";
import ManageItems from "../../pages/training-library/components/ManageItems";
import EditTrainingAudience from "../../pages/training-library/components/EditTrainingAudience";
import { useSearchParams } from "react-router-dom";
import { CoreContext } from "../core/core-context";
import { useLocalStorage } from "usehooks-ts";

export interface TrainingState {
  buildingNewCourse: boolean;

  activeSection?: TrainingSection;
  activeCourse?: TrainingCourse;
  activeAudience?: Audience;

  courses?: TrainingCourse[];

  viewCoursesSliderOpen?: boolean;
  editSectionSliderOpen?: boolean;
  manageItemsSliderOpen?: boolean;

  viewAudiencesSliderOpen?: boolean;
  editAudienceSliderOpen?: boolean;
}

export interface TrainingAction {
  type: string;
  // biome-ignore lint/suspicious/noExplicitAny: ...
  payload?: any;
}

const INITIAL_STATE: TrainingState = {
  buildingNewCourse: false,
};

export interface TrainingContextType {
  // REDUCER
  state: TrainingState;
  dispatch: Dispatch<TrainingAction>;

  sectionEditing?: Partial<TrainingSection>;
  setSectionEditing: Dispatch<
    React.SetStateAction<Partial<TrainingSection> | undefined>
  >;

  setActiveCourse: (courseId?: string) => void;
}

export const TrainingContext = createContext<TrainingContextType>({
  state: INITIAL_STATE,
  dispatch: () => {},

  setSectionEditing: () => {},

  setActiveCourse: () => {},
});

const trainingReducer = (
  state: TrainingState,
  action: TrainingAction
): TrainingState => {
  switch (action.type) {
    case "SET_BUILDING_NEW_COURSE":
      return {
        ...state,
        buildingNewCourse: action.payload,
      };
    case "SET_ACTIVE_SECTION":
      return {
        ...state,
        activeSection: action.payload,
      };
    case "SET_ACTIVE_COURSE":
      return {
        ...state,
        activeCourse: action.payload,
      };
    case "SET_ACTIVE_AUDIENCE":
      return {
        ...state,
        activeAudience: action.payload,
      };
    case "SET_COURSES":
      return {
        ...state,
        courses: action.payload,
      };
    case "SET_VIEW_COURSES_SLIDER_OPEN":
      return {
        ...state,
        viewCoursesSliderOpen: action.payload,
      };
    case "SET_EDIT_SECTION_SLIDER_OPEN":
      return {
        ...state,
        editSectionSliderOpen: action.payload,
      };
    case "SET_VIEW_AUDIENCES_SLIDER_OPEN":
      return {
        ...state,
        viewAudiencesSliderOpen: action.payload,
      };
    case "SET_EDIT_AUDIENCE_SLIDER_OPEN":
      return {
        ...state,
        editAudienceSliderOpen: action.payload,
      };
    case "SET_MANAGE_ITEMS_SLIDER_OPEN":
      return {
        ...state,
        manageItemsSliderOpen: action.payload,
      };
  }
  return state;
};

const SLIDE_OVER_DATA: {
  name: keyof TrainingState;
  dispatchType: string;
  Component: React.FC<{ setOpen: (open: boolean) => void }>;
}[] = [
  {
    name: "viewCoursesSliderOpen",
    dispatchType: "SET_VIEW_COURSES_SLIDER_OPEN",
    Component: ViewCourses,
  },
  {
    name: "editSectionSliderOpen",
    dispatchType: "SET_EDIT_SECTION_SLIDER_OPEN",
    Component: EditTrainingSection,
  },
  {
    name: "viewAudiencesSliderOpen",
    dispatchType: "SET_VIEW_AUDIENCES_SLIDER_OPEN",
    Component: ViewTrainingAudiences,
  },
  {
    name: "editAudienceSliderOpen",
    dispatchType: "SET_EDIT_AUDIENCE_SLIDER_OPEN",
    Component: EditTrainingAudience,
  },
  {
    name: "manageItemsSliderOpen",
    dispatchType: "SET_MANAGE_ITEMS_SLIDER_OPEN",
    Component: ManageItems,
  },
];

export const TrainingContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [activeCourseId, setActiveCourseId] = useLocalStorage<string | null>(
    "training_activeCourseId",
    null
  );
  const [sectionEditing, setSectionEditing] =
    useState<Partial<TrainingSection>>();

  const [state, dispatch] = useReducer(trainingReducer, INITIAL_STATE);
  const [searchParams] = useSearchParams();

  const { accessTokenClaims } = useContext(CoreContext);

  const { data: courses } = useQuery({
    queryKey: ["training-courses"],
    queryFn: () => getTrainingCourses({ limit: 100 }),
  });

  useEffect(() => {
    dispatch({
      type: "SET_COURSES",
      payload: courses?.results,
    });
  }, [courses?.results]);

  const { data: lastActiveCourse } = useQuery({
    queryKey: ["training-courses", activeCourseId],
    queryFn: () =>
      getTrainingCourse(activeCourseId ?? undefined).then((c) => {
        if (!c) {
          setActiveCourseId(null);
        }
        return c;
      }),
    enabled: !!activeCourseId,
  });

  useEffect(() => {
    if (searchParams.has("courseId")) {
      setActiveCourseId(searchParams.get("courseId"));
      dispatch({ type: "SET_BUILDING_NEW_COURSE", payload: false });
    }
  }, [searchParams, setActiveCourseId]);

  useEffect(() => {
    dispatch({
      type: "SET_ACTIVE_COURSE",
      payload: activeCourseId === null ? null : lastActiveCourse,
    });
  }, [lastActiveCourse, activeCourseId]);

  useEffect(() => {
    if (activeCourseId !== null) {
      return;
    }

    // If course not preselected, pick the first course matching one of the user's audiences.
    // Note: Users will most often only have a single audience.
    const userAudiences = accessTokenClaims?.audiences;
    if (Array.isArray(userAudiences) && userAudiences.length > 0) {
      const c = courses?.results.find((c) =>
        c.audiences.some((a) => userAudiences.includes(a.slug))
      );
      if (c?.id) {
        setActiveCourseId(c.id);
        return;
      }
    }

    setActiveCourseId(courses?.results[0]?.id ?? null);
  }, [
    courses,
    accessTokenClaims,
    activeCourseId,
    courses?.results[0]?.id,
    setActiveCourseId,
  ]);

  const setActiveCourse = (courseId?: string | null) => {
    setActiveCourseId(courseId ?? null);
  };

  return (
    <TrainingContext.Provider
      value={{
        state,
        dispatch,
        sectionEditing,
        setSectionEditing,
        setActiveCourse,
      }}
    >
      {children}
      {SLIDE_OVER_DATA.map(({ name, dispatchType, Component }) => (
        <SlideOver
          key={`${name}-${dispatchType}`}
          open={!!state[name]}
          setOpen={(open) => dispatch({ type: dispatchType, payload: open })}
        >
          <Component
            setOpen={(open) => dispatch({ type: dispatchType, payload: open })}
          />
        </SlideOver>
      ))}
    </TrainingContext.Provider>
  );
};

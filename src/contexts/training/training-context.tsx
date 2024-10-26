import React, {
  createContext,
  Dispatch,
  PropsWithChildren,
  useEffect,
  useReducer,
  useState,
} from "react";
import {
  Audience,
  CourseEnrollment,
  TrainingCourse,
  TrainingSection,
} from "../../types/entities";
import SlideOver from "../../components/layouts/slide-over/SlideOver";
import ViewEnrollments from "../../pages/training-library/components/ViewEnrollments";
import ViewTrainingAudiences from "../../pages/training-library/components/ViewTrainingAudiences";
import { useQuery } from "@tanstack/react-query";
import {
  getMyCourseEnrollments,
  getTrainingCourse,
} from "../../queries/training";
import EditTrainingSection from "../../pages/training-library/components/EditTrainingSection";
import ManageItems from "../../pages/training-library/components/ManageItems";
import EditTrainingAudience from "../../pages/training-library/components/EditTrainingAudience";
import { useLocalStorage } from "usehooks-ts";
import { useAuth, withAuthenticationRequired } from "../AuthProvider";
import { sortEnrollmentsByScoreFn } from "../../utils/training";

export interface TrainingState {
  activeSection?: TrainingSection;
  activeCourse?: TrainingCourse;
  activeAudience?: Audience;

  enrollments?: CourseEnrollment[];
  activeEnrollment?: CourseEnrollment;

  viewCoursesSliderOpen?: boolean;
  editSectionSliderOpen?: boolean;
  manageItemsSliderOpen?: boolean;

  viewAudiencesSliderOpen?: boolean;
  editAudienceSliderOpen?: boolean;
}

export interface TrainingAction {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
}

const INITIAL_STATE: TrainingState = {};

export interface TrainingContextType {
  // REDUCER
  state: TrainingState;
  dispatch: Dispatch<TrainingAction>;

  sectionEditing?: Partial<TrainingSection>;
  setSectionEditing: Dispatch<
    React.SetStateAction<Partial<TrainingSection> | undefined>
  >;

  setActiveEnrollmentId: Dispatch<React.SetStateAction<string | null>>;
  courseLoading: boolean;
}

export const TrainingContext = createContext<TrainingContextType>({
  state: INITIAL_STATE,
  dispatch: () => {},

  setSectionEditing: () => {},

  setActiveEnrollmentId: () => {},
  courseLoading: true,
});

const trainingReducer = (
  state: TrainingState,
  action: TrainingAction
): TrainingState => {
  switch (action.type) {
    case "SET_ACTIVE_COURSE":
      return {
        ...state,
        activeCourse: action.payload,
      };
    case "SET_ACTIVE_SECTION":
      return {
        ...state,
        activeSection: action.payload,
      };
    case "SET_ACTIVE_ENROLLMENT":
      return {
        ...state,
        activeEnrollment: action.payload,
      };
    case "SET_ACTIVE_AUDIENCE":
      return {
        ...state,
        activeAudience: action.payload,
      };
    case "SET_ENROLLMENTS":
      return {
        ...state,
        enrollments: action.payload,
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
    Component: ViewEnrollments,
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

export const TrainingContextProvider: React.FC<PropsWithChildren> =
  withAuthenticationRequired(({ children }) => {
    const [activeEnrollmentId, setActiveEnrollmentId] = useLocalStorage<
      string | null
    >("training_activeEnrollmentId", null);
    const [sectionEditing, setSectionEditing] =
      useState<Partial<TrainingSection>>();

    const [state, dispatch] = useReducer(trainingReducer, INITIAL_STATE);

    const { accessTokenClaims } = useAuth();

    const { data: enrollments } = useQuery({
      queryKey: ["my-course-enrollments"],
      queryFn: () => getMyCourseEnrollments(),
    });

    const { data: activeCourse, isPending: courseLoading } = useQuery({
      queryKey: ["training-course", state.activeEnrollment?.course.id] as const,
      queryFn: ({ queryKey }) => getTrainingCourse(queryKey[1]),
      enabled: !!state.activeEnrollment?.course.id,
    });

    useEffect(() => {
      dispatch({
        type: "SET_ENROLLMENTS",
        payload: enrollments,
      });
    }, [enrollments]);

    useEffect(() => {
      dispatch({
        type: "SET_ACTIVE_COURSE",
        payload: activeCourse,
      });
    }, [activeCourse]);

    // Automatically select enrollment.
    useEffect(() => {
      if (!enrollments) {
        return;
      }

      const setActiveEnrollment = (enrollment: CourseEnrollment | null) => {
        dispatch({
          type: "SET_ACTIVE_ENROLLMENT",
          payload: enrollment,
        });
      };

      if (activeEnrollmentId) {
        const foundEnrollment = enrollments.find(
          (enrollment) => enrollment.id === activeEnrollmentId
        );

        if (foundEnrollment) {
          setActiveEnrollment(foundEnrollment);
          return;
        }
      }

      // If course not preselected, pick the first course matching one of the user's audiences.
      // Note: Users will most often only have a single audience.
      const userAudiences = Array.isArray(accessTokenClaims?.audiences)
        ? accessTokenClaims?.audiences
        : [];

      const sortedEnrollments = enrollments.sort(
        sortEnrollmentsByScoreFn(userAudiences)
      );

      const chosenEnrollment = sortedEnrollments[0];
      setActiveEnrollment(chosenEnrollment);
      setActiveEnrollmentId(chosenEnrollment?.id ?? null);
    }, [
      enrollments,
      activeEnrollmentId,
      accessTokenClaims?.audiences,
      setActiveEnrollmentId,
    ]);

    return (
      <TrainingContext.Provider
        value={{
          state,
          dispatch,
          sectionEditing,
          setSectionEditing,
          setActiveEnrollmentId,
          courseLoading,
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
              setOpen={(open) =>
                dispatch({ type: dispatchType, payload: open })
              }
            />
          </SlideOver>
        ))}
      </TrainingContext.Provider>
    );
  });

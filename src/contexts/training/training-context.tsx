import React, {
  createContext,
  Dispatch,
  PropsWithChildren,
  useEffect,
  useReducer,
} from "react";
import {
  Audience,
  CourseEnrollment,
  ItemCompletion,
  TrainingCourse,
  TrainingItem,
} from "../../types/entities";
import SlideOver from "../../components/layouts/slide-over/SlideOver";
import ViewEnrollments from "../../pages/training-library/components/ViewEnrollments";
import ViewTrainingAudiences from "../../pages/training-library/components/ViewTrainingAudiences";
import { useQuery } from "@tanstack/react-query";
import {
  getMyCourseEnrollments,
  getMyItemCompletions,
  getTrainingCourse,
} from "../../queries/training";
import EditTrainingSection from "../../pages/training-library/components/EditTrainingSection";
import ManageItems from "../../pages/training-library/components/ManageItems";
import EditTrainingAudience from "../../pages/training-library/components/EditTrainingAudience";
import { useLocalStorage } from "usehooks-ts";
import { sortEnrollmentsByScoreFn } from "../../utils/training";
import { withAuthenticationRequired } from "../auth/withAuthenticationRequired";
import { useAuth } from "../auth/useAuth";

export interface TrainingState {
  activeCourse?: TrainingCourse;
  activeAudience?: Audience;

  editingSectionId?: string;

  enrollments?: CourseEnrollment[];
  activeEnrollment?: CourseEnrollment;

  itemCompletions?: ItemCompletion[];
  itemCompletionsMap?: Map<TrainingItem["id"], ItemCompletion>;

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

  setActiveEnrollmentId: Dispatch<React.SetStateAction<string | null>>;
  courseLoading: boolean;
}

export const TrainingContext = createContext<TrainingContextType>({
  state: INITIAL_STATE,
  dispatch: () => {},

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
    case "SET_ACTIVE_ENROLLMENT":
      return {
        ...state,
        activeEnrollment: action.payload,
      };
    case "SET_EDITING_SECTION":
      return {
        ...state,
        editingSectionId:
          typeof action.payload !== "boolean"
            ? action.payload
            : state.editingSectionId,
        editSectionSliderOpen: action.payload !== false,
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
    case "SET_ITEM_COMPLETIONS":
      return {
        ...state,
        itemCompletions: action.payload,
        itemCompletionsMap:
          action.payload && Array.isArray(action.payload)
            ? (action.payload as ItemCompletion[]).reduce((acc, completion) => {
                completion.item?.id && acc.set(completion.item.id, completion);
                return acc;
              }, new Map<TrainingItem["id"], ItemCompletion>())
            : undefined,
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
    >("threatzero.tranining.active-enrollment-id", null);

    const [state, dispatch] = useReducer(trainingReducer, INITIAL_STATE);

    const { accessTokenClaims } = useAuth();

    const { data: enrollments } = useQuery({
      queryKey: ["my-course-enrollments"],
      queryFn: () => getMyCourseEnrollments(),
    });

    const { data: activeCourse, isPending: courseLoading } = useQuery({
      queryKey: [
        "training-course",
        "id",
        state.activeEnrollment?.course.id,
      ] as const,
      queryFn: ({ queryKey }) => getTrainingCourse(queryKey[2]),
      enabled: !!state.activeEnrollment?.course.id,
    });

    const { data: itemCompletions } = useQuery({
      queryKey: [
        "item-completions",
        { "enrollment.id": activeEnrollmentId, limit: 100 },
      ] as const,
      queryFn: ({ queryKey }) => getMyItemCompletions(queryKey[1]),
      enabled: !!activeEnrollmentId,
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

    useEffect(() => {
      dispatch({
        type: "SET_ITEM_COMPLETIONS",
        payload: itemCompletions?.results,
      });
    }, [itemCompletions]);

    // Automatically select enrollment.
    useEffect(() => {
      if (!enrollments || !enrollments.length) {
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

      const chosenEnrollment =
        enrollments
          .sort(sortEnrollmentsByScoreFn(userAudiences))
          .find((e) => e) ?? null;

      setActiveEnrollment(chosenEnrollment);

      const newEnrollmentId = chosenEnrollment?.id ?? null;
      if (
        document.visibilityState === "visible" &&
        activeEnrollmentId !== newEnrollmentId
      ) {
        setActiveEnrollmentId(newEnrollmentId);
      }
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

import { createContext, Dispatch, PropsWithChildren } from "react";
import SlideOver from "../../components/layouts/slide-over/SlideOver";
import EditFormMetadata from "../../components/forms/builder/EditFormMetadata";
import { Field, FieldGroup, Form } from "../../types/entities";
import EditField from "../../components/forms/builder/EditField";
import EditFieldGroup from "../../components/forms/builder/EditFieldGroup";
import { ImmerReducer, useImmerReducer } from "use-immer";

export interface FormsState {
  activeForm?: Partial<Form>;

  metadataSliderOpen?: boolean;

  activeField?: Partial<Field>;
  editFieldSliderOpen?: boolean;

  activeFieldGroup?: Partial<FieldGroup>;
  editFieldGroupSliderOpen?: boolean;
}

export interface FormsAction {
  type: string;
  // biome-ignore lint/suspicious/noExplicitAny: ...
  payload?: any;
}

const INITIAL_STATE: FormsState = {};

export interface FormsContextType {
  // REDUCER
  state: FormsState;
  dispatch: Dispatch<FormsAction>;

  // HELPERS
  handleEditField: (field?: Partial<Field>) => void;
  handleEditFieldGroup: (fieldGroup?: Partial<FieldGroup>) => void;
}

export const FormsContext = createContext<FormsContextType>({
  state: INITIAL_STATE,
  dispatch: () => {},

  handleEditField: () => {},
  handleEditFieldGroup: () => {},
});

const formsReducer: ImmerReducer<FormsState, FormsAction> = (state, action) => {
  switch (action.type) {
    case "SET_ACTIVE_FORM":
      state.activeForm = action.payload;
      break;
    case "SET_METADATA_SLIDER_OPEN":
      state.metadataSliderOpen = action.payload;
      break;
    case "SET_ACTIVE_FIELD":
      state.activeField = action.payload;
      break;
    case "SET_EDIT_FIELD_SLIDER_OPEN":
      state.editFieldSliderOpen = action.payload;
      break;
    case "SET_ACTIVE_FIELD_GROUP":
      state.activeFieldGroup = action.payload;
      break;
    case "SET_EDIT_FIELD_GROUP_SLIDER_OPEN":
      state.editFieldGroupSliderOpen = action.payload;
      break;
  }
};

export const FormsContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [state, dispatch] = useImmerReducer(formsReducer, INITIAL_STATE);

  const handleEditField = (field?: Partial<Field>) => {
    dispatch({ type: "SET_ACTIVE_FIELD", payload: field });
    dispatch({ type: "SET_EDIT_FIELD_SLIDER_OPEN", payload: true });
  };

  const handleEditFieldGroup = (fieldGroup?: Partial<FieldGroup>) => {
    dispatch({ type: "SET_ACTIVE_FIELD_GROUP", payload: fieldGroup });
    dispatch({ type: "SET_EDIT_FIELD_GROUP_SLIDER_OPEN", payload: true });
  };

  return (
    <FormsContext.Provider
      value={{
        state,
        dispatch,
        handleEditField,
        handleEditFieldGroup,
      }}
    >
      {children}
      <SlideOver
        open={!!state.metadataSliderOpen}
        setOpen={(open) =>
          dispatch({ type: "SET_METADATA_SLIDER_OPEN", payload: open })
        }
      >
        <EditFormMetadata />
      </SlideOver>
      <SlideOver
        open={!!state.editFieldSliderOpen}
        setOpen={(open) =>
          dispatch({ type: "SET_EDIT_FIELD_SLIDER_OPEN", payload: open })
        }
      >
        <EditField />
      </SlideOver>
      <SlideOver
        open={!!state.editFieldGroupSliderOpen}
        setOpen={(open) =>
          dispatch({
            type: "SET_EDIT_FIELD_GROUP_SLIDER_OPEN",
            payload: open,
          })
        }
      >
        <EditFieldGroup />
      </SlideOver>
    </FormsContext.Provider>
  );
};

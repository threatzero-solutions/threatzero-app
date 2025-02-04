import {
  Children,
  cloneElement,
  createContext,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMap } from "usehooks-ts";
import { classNames, cn } from "../../utils/core";

interface StepsProps extends PropsWithChildren {}

const StepsContext = createContext<{
  stepsCount: number;
  currentStep: number;
  stepForward: () => void;
  stepBackward: () => void;
  stepTo: (stepIndex: number) => void;
  getCanStepForward: (stepIndex: number) => boolean;
  getCanStepBackward: (stepIndex: number) => boolean;
  getCanStepTo: (stepIndex: number) => boolean;
  getIsUpcomingStep: (stepIndex: number) => boolean;
  getIsPastStep: (stepIndex: number) => boolean;
  getIsCurrentStep: (stepIndex: number) => boolean;
  reportProceedableStep: (stepIndex: number, canProceed: boolean) => void;
}>({
  stepsCount: 0,
  currentStep: 0,
  stepForward: () => {},
  stepBackward: () => {},
  stepTo: () => {},
  getCanStepForward: () => false,
  getCanStepBackward: () => false,
  getCanStepTo: () => false,
  getIsUpcomingStep: () => false,
  getIsPastStep: () => false,
  getIsCurrentStep: () => false,
  reportProceedableStep: () => {},
});

const StepContext = createContext<{
  stepIndex: number;
}>({
  stepIndex: 0,
});

export const useSteps = () => {
  const value = useContext(StepsContext);
  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useAuth must be wrapped in a <AuthProvider />");
    }
  }

  return value;
};

export const Steps2: React.FC<StepsProps> = ({ children }) => {
  const stepsArray = Children.toArray(children) as ReactElement[];
  const [currentStep, setCurrentStep] = useState(0);
  const stepsCount = stepsArray.length;

  const [proceedableSteps, { set: setProceedableStep }] = useMap<
    number,
    boolean
  >([]);
  const maxProceedableStep = useMemo(() => {
    let max = stepsCount - 1;
    proceedableSteps.forEach((canProceed, stepNumber) => {
      if (stepNumber < max && !canProceed) {
        max = stepNumber;
      }
    });
    return max;
  }, [proceedableSteps, stepsCount]);

  const stepForward = () => {
    setCurrentStep((prev) => Math.min(prev + 1, maxProceedableStep));
  };

  const stepBackward = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const stepTo = (stepIndex: number) => {
    if (stepIndex > maxProceedableStep) {
      return;
    }
    setCurrentStep(stepIndex);
  };

  const canStepForward = (stepIndex: number) => stepIndex < maxProceedableStep;
  const canStepBackward = (stepIndex: number) => stepIndex > 0;
  const canStepTo = (stepIndex: number) => stepIndex <= maxProceedableStep;

  const isUpcomingStep = (stepIndex: number) => {
    return currentStep < stepIndex;
  };

  const isPastStep = (stepIndex: number) => {
    return currentStep > stepIndex;
  };

  const isCurrentStep = (stepIndex: number) => {
    return currentStep === stepIndex;
  };

  const reportProceedableStep = (stepIndex: number, canProceed: boolean) => {
    setProceedableStep(stepIndex, canProceed);
  };

  return (
    <nav aria-label="Progress">
      <ol className="">
        <StepsContext.Provider
          value={{
            stepsCount: stepsArray.length,
            currentStep,
            stepForward,
            stepBackward,
            stepTo,
            getCanStepForward: canStepForward,
            getCanStepBackward: canStepBackward,
            getCanStepTo: canStepTo,
            getIsUpcomingStep: isUpcomingStep,
            getIsPastStep: isPastStep,
            getIsCurrentStep: isCurrentStep,
            reportProceedableStep,
          }}
        >
          {stepsArray.map(
            (child, index) => cloneElement(child, { stepIndex: index }) // Inject stepIndex into each Step
          )}
        </StepsContext.Provider>
      </ol>
    </nav>
  );
};

export interface StepProps extends PropsWithChildren {
  name: ReactNode;
  description?: ReactNode;
  canProceed?: boolean;
  stepIndex?: number; // This will be injected by Steps
}

export const Step: React.FC<StepProps> = ({
  name,
  description,
  canProceed = true,
  stepIndex = 0,
  children,
}) => {
  const {
    stepsCount,
    getCanStepTo,
    stepTo,
    getIsPastStep,
    getIsCurrentStep,
    reportProceedableStep,
  } = useSteps();

  const previousCanProceed = useRef<boolean | null>(null);
  useEffect(() => {
    if (previousCanProceed.current === canProceed) {
      return;
    }
    previousCanProceed.current = canProceed;
    reportProceedableStep(stepIndex, canProceed);
  }, [reportProceedableStep, canProceed, stepIndex]);

  const canStepTo = getCanStepTo(stepIndex);
  const isPastStep = getIsPastStep(stepIndex);
  const isCurrentStep = getIsCurrentStep(stepIndex);

  return (
    <li
      className={classNames(
        stepIndex !== stepsCount - 1 ? "pb-10" : "",
        "relative"
      )}
    >
      {stepIndex !== stepsCount - 1 && (
        <div
          className={cn(
            "absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5",
            isPastStep ? "bg-secondary-600" : "bg-gray-300"
          )}
          aria-hidden="true"
        />
      )}
      <button
        onClick={() => stepTo(stepIndex)}
        type="button"
        className="group relative flex items-center bg-none border-none p-0 cursor-default enabled:cursor-pointer"
        aria-current="step"
        disabled={!canStepTo}
      >
        <span className="flex h-9 items-center">
          <span
            className={cn(
              "relative z-10 flex h-8 w-8 items-center justify-center rounded-full",
              isPastStep
                ? "bg-secondary-600 group-hover:group-enabled:bg-secondary-800"
                : isCurrentStep
                ? "border-2 border-secondary-600 bg-white"
                : "border-2 border-gray-300 bg-white group-hover:group-enabled:border-gray-400"
            )}
          >
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                isPastStep
                  ? "bg-white group-hover:group-enabled:bg-gray-300"
                  : isCurrentStep
                  ? "bg-secondary-600"
                  : " bg-transparent group-hover:group-enabled:bg-gray-300"
              )}
            />
          </span>
        </span>
        <span className="ml-4 flex min-w-0 flex-col text-start">
          <span
            className={cn(
              "text-sm font-medium",
              isPastStep
                ? ""
                : isCurrentStep
                ? "text-secondary-600"
                : "text-gray-500"
            )}
          >
            {name}
          </span>
          {description && (
            <span className="text-sm text-gray-500">{description}</span>
          )}
        </span>
      </button>
      <div className={cn("ml-12 py-4", isCurrentStep ? "block" : "hidden")}>
        <StepContext.Provider value={{ stepIndex }}>
          {children}
        </StepContext.Provider>
      </div>
    </li>
  );
};

export function StepBackwardButton({ children }: PropsWithChildren) {
  const { stepBackward, getCanStepBackward } = useSteps();
  const { stepIndex } = useContext(StepContext);

  return (
    <button
      onClick={stepBackward}
      type="button"
      className="cursor-pointer rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 enabled:hover:bg-gray-50 disabled:opacity-70"
      disabled={!getCanStepBackward(stepIndex)}
    >
      {children}
    </button>
  );
}

export function StepForwardButton({ children }: PropsWithChildren) {
  const { stepForward, getCanStepForward } = useSteps();
  const { stepIndex } = useContext(StepContext);

  return (
    <button
      onClick={stepForward}
      type="button"
      className="cursor-pointer inline-flex justify-center rounded-md bg-secondary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-secondary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-600 disabled:bg-secondary-400"
      disabled={!getCanStepForward(stepIndex)}
    >
      {children}
    </button>
  );
}

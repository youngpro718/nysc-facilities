import React, { createContext, useContext, useState, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, ACTIONS, EVENTS, Step } from 'react-joyride';
import { useLocation, useNavigate } from 'react-router-dom';
import { getTourForRoute } from './tours/tourSteps';

interface TourContextType {
  /** Start the tour for the current page */
  startTour: () => void;
  /** Start a tour for a specific route (navigates first) */
  startTourForRoute: (path: string) => void;
  /** Whether a tour is currently running */
  isRunning: boolean;
  /** Whether the current page has a tour available */
  hasTour: boolean;
  /** Title of the current page's tour */
  currentTourTitle: string | null;
}

const TourContext = createContext<TourContextType>({
  startTour: () => {},
  startTourForRoute: () => {},
  isRunning: false,
  hasTour: false,
  currentTourTitle: null,
});

export const useTour = () => useContext(TourContext);

const TOUR_STYLES = {
  options: {
    zIndex: 10000,
    primaryColor: 'hsl(var(--primary))',
    textColor: 'hsl(var(--foreground))',
    backgroundColor: 'hsl(var(--card))',
    arrowColor: 'hsl(var(--card))',
    overlayColor: 'rgba(0, 0, 0, 0.6)',
  },
  tooltipContainer: {
    textAlign: 'left' as const,
  },
  buttonNext: {
    backgroundColor: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
  },
  buttonBack: {
    color: 'hsl(var(--muted-foreground))',
    marginRight: '8px',
    fontSize: '14px',
  },
  buttonSkip: {
    color: 'hsl(var(--muted-foreground))',
    fontSize: '13px',
  },
  tooltip: {
    borderRadius: '12px',
    padding: '20px',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  tooltipTitle: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '8px',
  },
  tooltipContent: {
    fontSize: '14px',
    lineHeight: '1.6',
  },
  spotlight: {
    borderRadius: '8px',
  },
};

export function TourProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepIndex, setStepIndex] = useState(0);

  const tourInfo = getTourForRoute(location.pathname);

  const startTour = useCallback(() => {
    const info = getTourForRoute(location.pathname);
    if (info) {
      setSteps(info.steps);
      setStepIndex(0);
      setRun(true);
    }
  }, [location.pathname]);

  const startTourForRoute = useCallback((path: string) => {
    // Navigate to the page first, then start the tour after a short delay
    navigate(path);
    setTimeout(() => {
      const info = getTourForRoute(path);
      if (info) {
        setSteps(info.steps);
        setStepIndex(0);
        setRun(true);
      }
    }, 500);
  }, [navigate]);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, action, index, type } = data;

    // Handle step navigation
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }

    // Handle tour completion or skip
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      setStepIndex(0);

      // Mark tour as completed in localStorage
      const completedTours = JSON.parse(localStorage.getItem('completedTours') || '[]');
      if (!completedTours.includes(location.pathname)) {
        completedTours.push(location.pathname);
        localStorage.setItem('completedTours', JSON.stringify(completedTours));
      }
    }

    // Handle close button
    if (action === ACTIONS.CLOSE) {
      setRun(false);
      setStepIndex(0);
    }
  }, [location.pathname]);

  return (
    <TourContext.Provider
      value={{
        startTour,
        startTourForRoute,
        isRunning: run,
        hasTour: !!tourInfo,
        currentTourTitle: tourInfo?.title || null,
      }}
    >
      {children}
      <Joyride
        steps={steps}
        stepIndex={stepIndex}
        run={run}
        continuous
        showSkipButton
        showProgress
        scrollToFirstStep
        disableOverlayClose
        callback={handleJoyrideCallback}
        styles={TOUR_STYLES}
        locale={{
          back: 'Back',
          close: 'Close',
          last: 'Done',
          next: 'Next',
          skip: 'Skip tour',
        }}
        floaterProps={{
          disableAnimation: false,
        }}
      />
    </TourContext.Provider>
  );
}

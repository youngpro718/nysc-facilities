import React, { createContext, useContext, useState, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, ACTIONS, Step } from 'react-joyride';
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
  // Use a key to force Joyride to remount and reset when starting a new tour
  const [tourKey, setTourKey] = useState(0);

  const tourInfo = getTourForRoute(location.pathname);

  const startTour = useCallback(() => {
    const info = getTourForRoute(location.pathname);
    if (info) {
      // Filter steps to only include those whose targets exist in the DOM
      // (except 'body' which is always valid)
      const availableSteps = info.steps.filter((step) => {
        if (step.target === 'body') return true;
        return document.querySelector(step.target as string) !== null;
      });
      if (availableSteps.length === 0) return;
      setRun(false);
      setSteps(availableSteps);
      setTourKey((k) => k + 1);
      // Small delay to let Joyride unmount/remount with new steps
      setTimeout(() => setRun(true), 50);
    }
  }, [location.pathname]);

  const startTourForRoute = useCallback((path: string) => {
    navigate(path);
    setTimeout(() => {
      const info = getTourForRoute(path);
      if (info) {
        const availableSteps = info.steps.filter((step) => {
          if (step.target === 'body') return true;
          return document.querySelector(step.target as string) !== null;
        });
        if (availableSteps.length === 0) return;
        setRun(false);
        setSteps(availableSteps);
        setTourKey((k) => k + 1);
        setTimeout(() => setRun(true), 50);
      }
    }, 600);
  }, [navigate]);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, action } = data;

    // Tour finished or skipped
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);

      // Mark tour as completed
      const completedTours = JSON.parse(localStorage.getItem('completedTours') || '[]');
      if (!completedTours.includes(location.pathname)) {
        completedTours.push(location.pathname);
        localStorage.setItem('completedTours', JSON.stringify(completedTours));
      }
    }

    // User clicked the X close button
    if (action === ACTIONS.CLOSE) {
      setRun(false);
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
        key={tourKey}
        steps={steps}
        run={run}
        continuous
        showSkipButton
        showProgress
        scrollToFirstStep
        disableOverlayClose
        disableScrolling={false}
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

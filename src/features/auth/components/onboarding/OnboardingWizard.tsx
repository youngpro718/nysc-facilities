import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, ArrowLeft, X } from "lucide-react";
import { WelcomeStep } from "./steps/WelcomeStep";
import { ProfileStep } from "./steps/ProfileStep";
import { FeaturesStep } from "./steps/FeaturesStep";
import { CompleteStep } from "./steps/CompleteStep";
import { cn } from "@/lib/utils";

export interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

const steps = [
  { id: 'welcome', title: 'Welcome', component: WelcomeStep },
  { id: 'profile', title: 'Profile', component: ProfileStep },
  { id: 'features', title: 'Features', component: FeaturesStep },
  { id: 'complete', title: 'Complete', component: CompleteStep }
];

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [isAnimating, setIsAnimating] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll to top when step changes
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const animateStep = (nextStep: number, dir: 'forward' | 'back') => {
    if (isAnimating) return;
    setDirection(dir);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(nextStep);
      setIsAnimating(false);
    }, 200);
  };

  const handleNext = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < steps.length - 1) {
      animateStep(currentStep + 1, 'forward');
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      animateStep(currentStep - 1, 'back');
    }
  };

  const handleSkipAll = () => {
    onSkip();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const CurrentStepComponent = steps[currentStep].component;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Top bar — safe area aware */}
      <div className="shrink-0 pt-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleSkipAll}
            className="text-sm text-muted-foreground active:opacity-70 transition-opacity touch-manipulation py-1 px-2 -ml-2"
          >
            Skip
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            {currentStep + 1} of {steps.length}
          </span>
          <button
            onClick={handleSkipAll}
            className="p-2 -mr-2 rounded-full text-muted-foreground active:opacity-70 transition-opacity touch-manipulation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-3">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-3 pb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                  completedSteps.has(index)
                    ? "bg-primary text-primary-foreground scale-100"
                    : index === currentStep
                    ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30"
                    : "bg-muted text-muted-foreground scale-90"
                )}
              >
                {completedSteps.has(index) ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-0.5 rounded-full transition-colors duration-300",
                    completedSteps.has(index) ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content area — scrollable */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4"
      >
        <div
          className={cn(
            "transition-all duration-200 ease-out",
            isAnimating && direction === 'forward' && "opacity-0 translate-x-8",
            isAnimating && direction === 'back' && "opacity-0 -translate-x-8",
            !isAnimating && "opacity-100 translate-x-0"
          )}
        >
          <CurrentStepComponent />
        </div>
      </div>

      {/* Bottom navigation — safe area aware */}
      <div className="shrink-0 border-t bg-background/95 backdrop-blur-sm pb-safe">
        <div className="flex items-center gap-3 px-5 py-4">
          {currentStep > 0 ? (
            <Button
              variant="ghost"
              size="lg"
              onClick={handlePrevious}
              disabled={isAnimating}
              className="h-12 px-4 rounded-xl touch-manipulation active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          ) : (
            <div className="w-12" />
          )}

          <Button
            size="lg"
            onClick={handleNext}
            disabled={isAnimating}
            className={cn(
              "flex-1 h-12 rounded-xl text-base font-semibold touch-manipulation active:scale-[0.98] transition-transform gap-2",
              isLastStep && "bg-green-600 hover:bg-green-700"
            )}
          >
            {isLastStep ? "Get Started" : "Continue"}
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
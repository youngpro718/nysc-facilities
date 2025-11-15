
import { Check, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  steps: Array<{
    id: string;
    label: string;
  }>;
  currentStep: string;
  onStepClick?: (stepId: string) => void;
}

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <div className="w-full">
      <div className="hidden sm:flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
          const isCurrent = step.id === currentStep;

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center",
                index !== steps.length - 1 && "w-full"
              )}
            >
              <button
                type="button"
                className={cn(
                  "flex items-center justify-center shrink-0",
                  "w-8 h-8 rounded-full border-2 transition-colors relative",
                  isCurrent && "border-primary bg-primary text-primary-foreground",
                  isCompleted && "border-primary bg-primary/10",
                  !isCurrent && !isCompleted && "border-muted",
                  onStepClick && "cursor-pointer hover:border-primary/50"
                )}
                onClick={() => onStepClick?.(step.id)}
                disabled={!onStepClick}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <CircleDot className="h-4 w-4" />
                )}
                <span className="absolute -bottom-6 whitespace-nowrap text-sm">
                  {step.label}
                </span>
              </button>
              {index !== steps.length - 1 && (
                <div className={cn(
                  "h-[2px] w-full mx-2",
                  isCompleted ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile stepper */}
      <div className="flex sm:hidden items-center justify-center gap-1 py-2">
        {steps.map((step, index) => {
          const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
          const isCurrent = step.id === currentStep;

          return (
            <div
              key={step.id}
              className={cn(
                "h-2 rounded-full transition-all",
                isCurrent ? "w-8 bg-primary" : "w-2",
                isCompleted ? "bg-primary/50" : "bg-muted"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

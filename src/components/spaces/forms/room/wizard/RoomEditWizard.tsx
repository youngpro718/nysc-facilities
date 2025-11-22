import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "../RoomFormSchema";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { CoreIdentityStep } from "./steps/CoreIdentityStep";
import { CapacityAccessStep } from "./steps/CapacityAccessStep";
import { OccupancyAccessStep } from "./steps/OccupancyAccessStep";
import { CurrentIssuesStep } from "./steps/CurrentIssuesStep";
import { PhotosStep } from "./steps/PhotosStep";
import { MaintenanceStep } from "./steps/MaintenanceStep";
import { EnrichmentStep } from "./steps/EnrichmentStep";
import { cn } from "@/lib/utils";

interface RoomEditWizardProps {
  form: UseFormReturn<RoomFormData>;
  onSubmit: (data: RoomFormData) => Promise<void>;
  isPending: boolean;
  onCancel: () => void;
  roomId?: string;
}

const steps = [
  { id: 1, name: "Core Identity", optional: false },
  { id: 2, name: "Capacity & Access", optional: false },
  { id: 3, name: "Occupancy", optional: false },
  { id: 4, name: "Current Issues", optional: true },
  { id: 5, name: "Photos", optional: true },
  { id: 6, name: "Maintenance", optional: true },
  { id: 7, name: "Enrichment", optional: true },
];

export function RoomEditWizard({
  form,
  onSubmit,
  isPending,
  onCancel,
  roomId,
}: RoomEditWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const progress = (currentStep / steps.length) * 100;
  const currentStepInfo = steps.find((s) => s.id === currentStep);

  const handleNext = async () => {
    // Validate current step fields before moving forward
    const isValid = await form.trigger();
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStepInfo?.optional && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await form.trigger();
    if (isValid) {
      await onSubmit(form.getValues());
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CoreIdentityStep form={form} roomId={roomId} />;
      case 2:
        return <CapacityAccessStep form={form} />;
      case 3:
        return <OccupancyAccessStep form={form} roomId={roomId} />;
      case 4:
        return <CurrentIssuesStep roomId={roomId} />;
      case 5:
        return <PhotosStep form={form} roomId={roomId} />;
      case 6:
        return <MaintenanceStep form={form} roomId={roomId} />;
      case 7:
        return <EnrichmentStep form={form} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Step {currentStep} of {steps.length}
          </span>
          <span className="font-medium">{currentStepInfo?.name}</span>
        </div>
        <Progress value={progress} className="h-2" />
        
        {/* Step Pills */}
        <div className="flex gap-2 flex-wrap">
          {steps.map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setCurrentStep(step.id)}
              className={cn(
                "px-3 py-1 text-xs rounded-full transition-colors",
                currentStep === step.id
                  ? "bg-primary text-primary-foreground"
                  : currentStep > step.id
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground",
                "hover:opacity-80"
              )}
            >
              {step.name}
              {step.optional && (
                <span className="ml-1 text-[10px] opacity-70">(optional)</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <form onSubmit={handleSubmit}>
        <div className="min-h-[400px]">{renderStep()}</div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-2 pt-6 border-t mt-6">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            {currentStepInfo?.optional && currentStep < steps.length && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkip}
                disabled={isPending}
              >
                Skip
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={isPending}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            )}

            {currentStep < steps.length ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isPending}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button type="submit" disabled={isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

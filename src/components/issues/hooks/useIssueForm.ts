
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import type { FormData } from "../types/IssueTypes";

type Step = "type" | "details" | "location" | "photos" | "review";

export function useIssueForm(
  form: UseFormReturn<FormData>,
  onSubmit: (data: FormData) => Promise<void>
) {
  const [currentStep, setCurrentStep] = useState<Step>("type");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      toast.success("Issue created successfully");
      form.reset();
      setCurrentStep("type");
    } catch (error) {
      toast.error("Failed to create issue");
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    const steps: Step[] = ["type", "details", "location", "photos", "review"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const steps: Step[] = ["type", "details", "location", "photos", "review"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  return {
    currentStep,
    setCurrentStep,
    isSubmitting,
    handleSubmit: form.handleSubmit(handleSubmit),
    handleNext,
    handlePrevious
  };
}

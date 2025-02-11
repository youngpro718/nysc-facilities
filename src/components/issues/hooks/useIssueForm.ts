
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import type { FormData, Step } from "../types/IssueTypes";
import { useIssueTemplate } from "./useIssueTemplate";

export function useIssueForm(
  form: UseFormReturn<FormData>,
  onSubmit: (data: FormData) => Promise<void>
) {
  const [currentStep, setCurrentStep] = useState<Step>("type");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { templates, generateTitle } = useIssueTemplate(form.watch("type"));

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

  const updateTitleFromTemplate = (
    type: string,
    problemType: string,
    location: string
  ) => {
    const template = templates?.find(t => t.type === type);
    if (template) {
      const title = generateTitle(template, problemType, location);
      form.setValue("title", title);
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
    handlePrevious,
    updateTitleFromTemplate
  };
}

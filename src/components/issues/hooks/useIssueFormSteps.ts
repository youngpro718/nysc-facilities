
import { useState } from "react";
import { UseFormSetValue } from "react-hook-form";
import { Step, FormData } from "../types/IssueTypes";
import { issueTypes } from "../wizard/IssueTypeSelection";

export const useIssueFormSteps = (setValue: UseFormSetValue<FormData>) => {
  const [step, setStep] = useState<Step>("type");

  const handleTypeSelect = (type: typeof issueTypes[number]) => {
    setValue("type", type.type);
    setValue("title", type.defaultTitle);
    setValue("description", type.defaultDescription);
    setStep("details");
  };

  const handleNext = () => {
    switch (step) {
      case "type":
        setStep("details");
        break;
      case "details":
        setStep("location");
        break;
      case "location":
        setStep("photos");
        break;
      case "photos":
        setStep("review");
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case "details":
        setStep("type");
        break;
      case "location":
        setStep("details");
        break;
      case "photos":
        setStep("location");
        break;
      case "review":
        setStep("photos");
        break;
    }
  };

  return {
    step,
    setStep,
    handleTypeSelect,
    handleNext,
    handleBack
  };
};

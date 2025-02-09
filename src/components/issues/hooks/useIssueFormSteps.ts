
import { useState } from "react";
import { Step } from "../types/IssueTypes";
import { issueTypes } from "../wizard/IssueTypeSelection";
import { UseFormSetValue } from "react-hook-form";
import { FormData } from "../types/IssueTypes";

export const useIssueFormSteps = (setValue: UseFormSetValue<FormData>) => {
  const [step, setStep] = useState<Step>("type-selection");

  const handleTypeSelect = (type: typeof issueTypes[number]) => {
    setValue("type", type.type);
    setValue("title", type.defaultTitle);
    setValue("description", type.defaultDescription);
    setStep("details");
  };

  const handleNext = () => {
    switch (step) {
      case "type-selection":
        setStep("details");
        break;
      case "details":
        setStep("location");
        break;
      case "location":
        setStep("type");
        break;
      case "type":
        setStep("photos");
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case "details":
        setStep("type-selection");
        break;
      case "location":
        setStep("details");
        break;
      case "type":
        setStep("location");
        break;
      case "photos":
        setStep("type");
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

import { UseFormReturn } from "react-hook-form";
import { FormData } from "../types/formTypes";

export interface WizardStepProps {
  form: UseFormReturn<FormData>;
}
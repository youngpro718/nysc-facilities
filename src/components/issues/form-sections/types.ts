import { UseFormReturn } from "react-hook-form";
import { StandardizedIssueType } from "../constants/issueTypes";
import { FormData } from "../types/formTypes";

export interface LocationFieldsProps {
  form: UseFormReturn<FormData>;
  disableFields?: boolean;
}

export interface ProblemTypeFieldProps {
  form: UseFormReturn<FormData>;
}

export interface DescriptionFieldProps {
  form: UseFormReturn<FormData>;
}

export interface IssuePhotoFormProps {
  onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  uploading: boolean;
  selectedPhotos: string[];
  onPhotoRemove: (index: number) => void;
}

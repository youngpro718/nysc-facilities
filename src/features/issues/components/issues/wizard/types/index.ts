
import { ReactElement } from 'react';
import { StandardizedIssueType } from "../../constants/issueTypes";
import { UserAssignment } from "@/types/dashboard";
import { FormData } from "../../types/formTypes";
import { LucideProps } from 'lucide-react';

export type WizardStep = 'type' | 'location' | 'details' | 'review';

export interface IssueWizardProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  assignedRooms?: UserAssignment[];
  userId?: string;
}

export interface IssueTypeOption {
  id: StandardizedIssueType;
  label: string;
  icon: ReactElement<LucideProps>;
  color: string;
  description: string;
}

export interface WizardStepProps {
  form: any; // UseFormReturn
  onNext?: () => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export interface WizardContextType {
  currentStep: WizardStep;
  setCurrentStep: (step: WizardStep) => void;
  isEmergency: boolean;
  setIsEmergency: (value: boolean) => void;
  selectedIssueType: StandardizedIssueType | null;
  setSelectedIssueType: (type: StandardizedIssueType | null) => void;
  useAssignedRoom: boolean;
  setUseAssignedRoom: (value: boolean) => void;
  selectedPhotos: string[];
  setSelectedPhotos: (photos: string[]) => void;
  handlePhotoUpload: (files: FileList) => Promise<void>;
  uploading: boolean;
  assignedRooms?: UserAssignment[];
}

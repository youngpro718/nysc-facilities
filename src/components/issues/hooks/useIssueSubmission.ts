
import { supabase } from "@/integrations/supabase/client";
import { FormData } from "../types/IssueTypes";
import { toast } from "sonner";
import { UseFormReset } from "react-hook-form";

interface UseIssueSubmissionProps {
  selectedPhotos: string[];
  onSuccess: () => void;
  setOpen: (open: boolean) => void;
  reset: UseFormReset<FormData>;
  setSelectedPhotos: (photos: string[]) => void;
  setSelectedBuilding: (building: string | null) => void;
  setSelectedFloor: (floor: string | null) => void;
  setStep: (step: "type-selection" | "details" | "location" | "type" | "photos") => void;
}

export const useIssueSubmission = ({
  selectedPhotos,
  onSuccess,
  setOpen,
  reset,
  setSelectedPhotos,
  setSelectedBuilding,
  setSelectedFloor,
  setStep
}: UseIssueSubmissionProps) => {
  const onSubmit = async (data: FormData) => {
    try {
      const issueData = {
        ...data,
        photos: selectedPhotos,
        seen: false,
        template_fields: data.template_fields || {},
      };

      const { error } = await supabase
        .from('issues')
        .insert(issueData);

      if (error) throw error;

      toast.success("Issue created successfully");
      onSuccess();
      setOpen(false);
      reset();
      setSelectedPhotos([]);
      setSelectedBuilding(null);
      setSelectedFloor(null);
      setStep("type-selection");
    } catch (error: any) {
      toast.error(error.message || "Failed to create issue");
    }
  };

  return { onSubmit };
};

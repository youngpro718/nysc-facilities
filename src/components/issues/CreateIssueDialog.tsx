
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { CreateIssueForm } from "./CreateIssueForm";
import { IssueTypeSelection, issueTypes } from "./wizard/IssueTypeSelection";
import { IssueDetailsForm } from "./wizard/IssueDetailsForm";
import { IssueLocationForm } from "./wizard/IssueLocationForm";
import { IssuePhotoForm } from "./wizard/IssuePhotoForm";
import { IssueTypeForm } from "./wizard/IssueTypeForm";
import type { FormData } from "./types/IssueTypes";
import { useIssueFormSteps } from "./hooks/useIssueFormSteps";
import { useIssueSubmission } from "./hooks/useIssueSubmission";
import { usePhotoUpload } from "./hooks/usePhotoUpload";

export function CreateIssueDialog({ onIssueCreated }: { onIssueCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const { uploading, selectedPhotos, setSelectedPhotos, handlePhotoUpload } = usePhotoUpload();
  
  const form = useForm<FormData>({
    defaultValues: {
      status: "open",
      priority: "medium",
      type: "HVAC",
      assigned_to: "Self"
    }
  });

  const { step, setStep, handleTypeSelect, handleNext, handleBack } = useIssueFormSteps(form.setValue);
  const { onSubmit } = useIssueSubmission({
    selectedPhotos,
    onSuccess: onIssueCreated,
    setOpen,
    reset: form.reset,
    setSelectedPhotos,
    setSelectedBuilding,
    setSelectedFloor,
    setStep
  });

  const renderStep = () => {
    switch (step) {
      case "type-selection":
        return <IssueTypeSelection onTypeSelect={handleTypeSelect} />;
      case "details":
        return <IssueDetailsForm form={form} />;
      case "location":
        return (
          <IssueLocationForm
            form={form}
            selectedBuilding={selectedBuilding}
            selectedFloor={selectedFloor}
            setSelectedBuilding={setSelectedBuilding}
            setSelectedFloor={setSelectedFloor}
          />
        );
      case "type":
        return <IssueTypeForm form={form} />;
      case "photos":
        return (
          <IssuePhotoForm
            selectedPhotos={selectedPhotos}
            uploading={uploading}
            onPhotoUpload={handlePhotoUpload}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Issue
        </Button>
      </DialogTrigger>
      <DialogContent className={isMobile ? "max-h-[90vh] overflow-y-auto" : "max-w-5xl"}>
        <DialogHeader>
          <DialogTitle>Create New Issue</DialogTitle>
        </DialogHeader>
        
        {isMobile ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {renderStep()}
            
            <div className="flex justify-between pt-6 border-t">
              {step !== "type-selection" && (
                <Button type="button" variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
              <Button 
                type="button" 
                onClick={step === "photos" ? form.handleSubmit(onSubmit) : handleNext}
                disabled={uploading}
                className="ml-auto"
              >
                {step === "photos" ? "Create Issue" : "Next"}
              </Button>
            </div>
          </form>
        ) : (
          <CreateIssueForm onSubmit={onSubmit} />
        )}
      </DialogContent>
    </Dialog>
  );
}

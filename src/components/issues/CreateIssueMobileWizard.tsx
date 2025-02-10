import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Form } from "@/components/ui/form";
import { Plus, ArrowLeft, ArrowRight } from "lucide-react";
import { IssueTypeSelection, issueTypes } from "./wizard/IssueTypeSelection";
import { IssueDetailsForm } from "./wizard/IssueDetailsForm";
import { IssueLocationForm } from "./wizard/IssueLocationForm";
import { IssueTypeForm } from "./wizard/IssueTypeForm";
import { IssuePhotoForm } from "./wizard/IssuePhotoForm";
import { FormData, Step } from "./types/IssueTypes";
import { usePhotoUpload } from "./hooks/usePhotoUpload";
import { useIssueFormSteps } from "./hooks/useIssueFormSteps";
import { useIssueSubmission } from "./hooks/useIssueSubmission";

export function CreateIssueMobileWizard({ onIssueCreated }: { onIssueCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);

  const form = useForm<FormData>({
    defaultValues: {
      status: "open",
      priority: "medium",
      type: "GENERAL_REQUESTS",
      assigned_to: "Self"
    }
  });

  const { uploading, selectedPhotos, setSelectedPhotos, handlePhotoUpload } = usePhotoUpload();
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

  const renderStepContent = () => {
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
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Issue
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[92vh] pt-0">
        <SheetHeader className="sticky top-0 bg-background z-10 pt-6 pb-4">
          <SheetTitle className="text-xl">Create New Issue</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20 overflow-y-auto max-h-[calc(92vh-8rem)]">
            {renderStepContent()}
            <div className="fixed bottom-0 left-0 right-0 bg-background pt-4 pb-6 px-4 flex justify-between border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={step === "type-selection"}
                className="h-12 px-6"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type={step === "photos" ? "submit" : "button"}
                onClick={() => step !== "photos" && handleNext()}
                disabled={uploading}
                className="h-12 px-6"
              >
                {step === "photos" ? (
                  "Create Issue"
                ) : (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

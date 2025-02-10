
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Form } from "@/components/ui/form";
import { Plus, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { TypeSelection } from "./steps/TypeSelection";
import { IssueDetails } from "./steps/IssueDetails";
import { LocationSelection } from "./steps/LocationSelection";
import { PhotoUpload } from "./steps/PhotoUpload";
import { ReviewSubmit } from "./steps/ReviewSubmit";
import type { FormData } from "../types/IssueTypes";
import { useIssueForm } from "../hooks/useIssueForm";

interface IssueWizardProps {
  onSubmit: (data: FormData) => Promise<void>;
}

export function IssueWizard({ onSubmit }: IssueWizardProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<FormData>({
    defaultValues: {
      status: "open",
      priority: "medium",
      type: "GENERAL_REQUESTS",
      assigned_to: "Self"
    }
  });

  const { 
    isSubmitting,
    handleSubmit,
    currentStep,
    handlePrevious,
    handleNext
  } = useIssueForm(form, async (data) => {
    await onSubmit(data);
    setOpen(false);
  });

  const renderStep = () => {
    switch (currentStep) {
      case "type":
        return <TypeSelection form={form} />;
      case "details":
        return <IssueDetails form={form} />;
      case "location":
        return <LocationSelection form={form} />;
      case "photos":
        return <PhotoUpload />;
      case "review":
        return <ReviewSubmit form={form} />;
      default:
        return null;
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
          <form onSubmit={handleSubmit} className="space-y-6 pb-20 overflow-y-auto max-h-[calc(92vh-8rem)]">
            {renderStep()}
            <div className="fixed bottom-0 left-0 right-0 bg-background pt-4 pb-6 px-4 flex justify-between border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === "type" || isSubmitting}
                className="h-12 px-6"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              {currentStep === "review" ? (
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="h-12 px-6"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="h-12 px-6"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

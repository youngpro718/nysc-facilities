
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { TypeSelection } from "./steps/TypeSelection";
import { IssueDetails } from "./steps/IssueDetails";
import { LocationSelection } from "./steps/LocationSelection";
import { PhotoUpload } from "./steps/PhotoUpload";
import { ReviewSubmit } from "./steps/ReviewSubmit";
import { useIssueForm } from "../hooks/useIssueForm";
import type { FormData } from "../types/IssueTypes";

interface CreateIssueFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  initialType?: FormData["type"];
}

export function CreateIssueForm({ onSubmit, initialType }: CreateIssueFormProps) {
  const form = useForm<FormData>({
    defaultValues: {
      status: "open",
      priority: "medium",
      type: initialType || "GENERAL_REQUESTS",
      assigned_to: "Self"
    }
  });

  const { 
    isSubmitting,
    handleSubmit,
    currentStep,
    setCurrentStep,
    handlePrevious,
    handleNext
  } = useIssueForm(form, onSubmit);

  const steps = [
    { id: "type", label: "Type & Priority" },
    { id: "details", label: "Details" },
    { id: "location", label: "Location" },
    { id: "photos", label: "Photos" },
    { id: "review", label: "Review" }
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <Card className="bg-card/30 backdrop-blur-xl border-white/10 shadow-2xl">
        <div className="p-4 sm:p-6">
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs value={currentStep} onValueChange={setCurrentStep} className="w-full">
                <TabsList className="w-full justify-between bg-background/50 p-1 rounded-lg backdrop-blur-sm">
                  {steps.map((step) => (
                    <TabsTrigger
                      key={step.id}
                      value={step.id}
                      className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                        transition-all duration-200 text-sm py-2
                        data-[state=active]:shadow-lg disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      {step.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="mt-6">
                  <TabsContent value="type" className="m-0">
                    <ScrollArea className="h-[500px] pr-4">
                      <TypeSelection form={form} />
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="details" className="m-0">
                    <ScrollArea className="h-[500px] pr-4">
                      <IssueDetails form={form} />
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="location" className="m-0">
                    <ScrollArea className="h-[500px] pr-4">
                      <LocationSelection form={form} />
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="photos" className="m-0">
                    <ScrollArea className="h-[500px] pr-4">
                      <PhotoUpload />
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="review" className="m-0">
                    <ScrollArea className="h-[500px] pr-4">
                      <ReviewSubmit form={form} />
                    </ScrollArea>
                  </TabsContent>
                </div>
              </Tabs>

              <div className="flex justify-between pt-6 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === "type" || isSubmitting}
                  className="w-32"
                >
                  Previous
                </Button>

                {currentStep === "review" ? (
                  <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-32"
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
                    disabled={currentStep === "review" || isSubmitting}
                    className="w-32"
                  >
                    Next
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </Card>
    </div>
  );
}

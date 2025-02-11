
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormData } from "./types/IssueTypes";
import { IssueLocationForm } from "./wizard/IssueLocationForm";
import { IssueTypeForm } from "./wizard/IssueTypeForm";
import { IssuePhotoForm } from "./wizard/IssuePhotoForm";
import { usePhotoUpload } from "./hooks/usePhotoUpload";
import { ScrollArea } from "../ui/scroll-area";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IssueDetailsForm } from "./wizard/IssueDetailsForm";
import { IssueReviewTab } from "./tabs/IssueReviewTab";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateIssueFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  initialType?: FormData["type"];
}

export function CreateIssueForm({ onSubmit, initialType }: CreateIssueFormProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const { uploading, selectedPhotos, setSelectedPhotos, handlePhotoUpload } = usePhotoUpload();
  const [activeTab, setActiveTab] = useState("type");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      status: "open",
      priority: "medium",
      type: initialType || "GENERAL_REQUESTS",
      assigned_to: "Self"
    }
  });

  const handleFormSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit({ ...data, photos: selectedPhotos });
      toast.success("Issue created successfully");
      form.reset();
      setSelectedPhotos([]);
      setSelectedBuilding(null);
      setSelectedFloor(null);
      setActiveTab("type");
    } catch (error: any) {
      toast.error(error.message || "Failed to create issue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoRemove = (index: number) => {
    const newPhotos = [...selectedPhotos];
    newPhotos.splice(index, 1);
    setSelectedPhotos(newPhotos);
  };

  const tabs = [
    { id: "type", label: "Type & Priority" },
    { id: "location", label: "Location" },
    { id: "details", label: "Details" },
    { id: "photos", label: "Photos" },
    { id: "review", label: "Review" }
  ];

  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);

  const handleNext = () => {
    const nextTab = tabs[currentTabIndex + 1];
    if (nextTab) {
      setActiveTab(nextTab.id);
    }
  };

  const handlePrevious = () => {
    const prevTab = tabs[currentTabIndex - 1];
    if (prevTab) {
      setActiveTab(prevTab.id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <Card className="bg-card/30 backdrop-blur-xl border-white/10 shadow-2xl">
        <div className="p-4 sm:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-between bg-background/50 p-1 rounded-lg backdrop-blur-sm">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        "flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                        "transition-all duration-200 text-sm py-2",
                        "data-[state=active]:shadow-lg",
                        "disabled:opacity-50"
                      )}
                      disabled={isSubmitting}
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="mt-6">
                  <TabsContent value="type" className="m-0">
                    <ScrollArea className="h-[500px] pr-4">
                      <IssueTypeForm form={form} />
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="location" className="m-0">
                    <ScrollArea className="h-[500px] pr-4">
                      <IssueLocationForm
                        form={form}
                        selectedBuilding={selectedBuilding}
                        selectedFloor={selectedFloor}
                        setSelectedBuilding={setSelectedBuilding}
                        setSelectedFloor={setSelectedFloor}
                      />
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="details" className="m-0">
                    <ScrollArea className="h-[500px] pr-4">
                      <IssueDetailsForm form={form} />
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="photos" className="m-0">
                    <ScrollArea className="h-[500px] pr-4">
                      <IssuePhotoForm
                        selectedPhotos={selectedPhotos}
                        uploading={uploading}
                        onPhotoUpload={handlePhotoUpload}
                        onPhotoRemove={handlePhotoRemove}
                      />
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="review" className="m-0">
                    <ScrollArea className="h-[500px] pr-4">
                      <IssueReviewTab
                        formData={form.getValues()}
                        photos={selectedPhotos}
                      />
                    </ScrollArea>
                  </TabsContent>
                </div>
              </Tabs>

              <div className="flex justify-between pt-6 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentTabIndex === 0 || isSubmitting}
                  className="w-32"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                
                {activeTab === "review" ? (
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || uploading} 
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
                    disabled={currentTabIndex === tabs.length - 1 || isSubmitting}
                    className="w-32"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
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

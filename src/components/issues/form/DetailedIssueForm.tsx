
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { FormData } from "../types/IssueTypes";
import { BaseFields } from "./BaseFields";
import { TimelineFields } from "./TimelineFields";
import { AssignmentFields } from "./AssignmentFields";
import { IssueLocationForm } from "../wizard/IssueLocationForm";
import { IssuePhotoForm } from "../wizard/IssuePhotoForm";
import { IssueTypeForm } from "../wizard/IssueTypeForm";
import { Button } from "@/components/ui/button";
import { usePhotoUpload } from "../hooks/usePhotoUpload";
import { useState } from "react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DetailedIssueFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  initialData?: Partial<FormData>;
}

export function DetailedIssueForm({ onSubmit, initialData }: DetailedIssueFormProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const { uploading, selectedPhotos, setSelectedPhotos, handlePhotoUpload } = usePhotoUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      status: "open",
      priority: "medium",
      type: "GENERAL_REQUESTS",
      assigned_to: "Self",
      ...initialData
    }
  });

  const handleFormSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit({ ...data, photos: selectedPhotos });
      toast.success("Issue saved successfully");
    } catch (error) {
      toast.error("Failed to save issue");
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-card/30 backdrop-blur-xl border-white/10 shadow-2xl">
      <div className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="type">Type & Category</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="assignment">Assignment</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="basic">
                  <ScrollArea className="h-[500px] pr-4">
                    <BaseFields form={form} />
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="type">
                  <ScrollArea className="h-[500px] pr-4">
                    <IssueTypeForm form={form} />
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="location">
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

                <TabsContent value="timeline">
                  <ScrollArea className="h-[500px] pr-4">
                    <TimelineFields form={form} />
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="assignment">
                  <ScrollArea className="h-[500px] pr-4">
                    <AssignmentFields form={form} />
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="photos">
                  <ScrollArea className="h-[500px] pr-4">
                    <IssuePhotoForm
                      selectedPhotos={selectedPhotos}
                      uploading={uploading}
                      onPhotoUpload={handlePhotoUpload}
                    />
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>

            <div className="flex justify-end pt-6 border-t border-white/10">
              <Button 
                type="submit" 
                disabled={isSubmitting || uploading}
                className="w-32"
              >
                {isSubmitting ? "Saving..." : "Save Issue"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Card>
  );
}

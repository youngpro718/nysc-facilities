
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form } from "@/components/ui/form";
import { issueTypes } from "./wizard/IssueTypeSelection";
import { FormData } from "./types/IssueTypes";
import { IssueLocationForm } from "./wizard/IssueLocationForm";
import { IssueTypeForm } from "./wizard/IssueTypeForm";
import { IssuePhotoForm } from "./wizard/IssuePhotoForm";
import { usePhotoUpload } from "./hooks/usePhotoUpload";
import { ScrollArea } from "../ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Building2, Camera, FileText, MapPin } from "lucide-react";

interface CreateIssueFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  initialType?: FormData["type"];
}

export function CreateIssueForm({ onSubmit, initialType }: CreateIssueFormProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const { uploading, selectedPhotos, setSelectedPhotos, handlePhotoUpload } = usePhotoUpload();

  const form = useForm<FormData>({
    defaultValues: {
      status: "open",
      priority: "medium",
      type: initialType || "HVAC",
      assigned_to: "Self"
    }
  });

  const selectedType = issueTypes.find(t => t.type === form.watch("type"));

  const handleFormSubmit = async (data: FormData) => {
    if (selectedType && selectedPhotos.length < selectedType.requiredPhotos) {
      toast({
        title: "Error",
        description: `Please upload at least ${selectedType.requiredPhotos} photo${selectedType.requiredPhotos > 1 ? 's' : ''}`,
        variant: "destructive"
      });
      return;
    }
    await onSubmit({ ...data, photos: selectedPhotos });
  };

  return (
    <div className="grid grid-cols-2 gap-8 p-6 bg-[#f8f9fa] min-h-[calc(100vh-8rem)]">
      <Card className="p-6 border-none shadow-lg bg-gradient-to-br from-white to-gray-50">
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <FileText className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Issue Type</h2>
                </div>
                <IssueTypeForm form={form} />
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <FileText className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">Details</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">Title</Label>
                      <Input 
                        placeholder="Enter a descriptive title" 
                        {...form.register("title")}
                        className="h-12 text-base mt-2 bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-base font-medium">Description</Label>
                      <Textarea 
                        placeholder="Provide detailed information about the issue" 
                        {...form.register("description")}
                        className="min-h-[120px] text-base mt-2 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <MapPin className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">Location</h2>
                  </div>
                  <IssueLocationForm
                    form={form}
                    selectedBuilding={selectedBuilding}
                    selectedFloor={selectedFloor}
                    setSelectedBuilding={setSelectedBuilding}
                    setSelectedFloor={setSelectedFloor}
                  />
                </div>

                {selectedType?.contextFields.includes("temperature") && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Building2 className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold">Additional Details</h2>
                    </div>
                    <div>
                      <Label className="text-base font-medium">Temperature (°F)</Label>
                      <Input 
                        type="number" 
                        {...form.register("temperature")}
                        className="h-12 text-base mt-2 bg-white"
                      />
                    </div>
                  </div>
                )}

                {selectedType?.contextFields.includes("damage_assessment") && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Building2 className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold">Damage Assessment</h2>
                    </div>
                    <div>
                      <Label className="text-base font-medium">Assessment Details</Label>
                      <Textarea 
                        {...form.register("damage_assessment")}
                        placeholder="Describe the extent of damage"
                        className="min-h-[100px] text-base mt-2 bg-white"
                      />
                    </div>
                  </div>
                )}

                {selectedType?.contextFields.includes("area_size") && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Building2 className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold">Area Details</h2>
                    </div>
                    <div>
                      <Label className="text-base font-medium">Area Size</Label>
                      <Input 
                        {...form.register("area_size")}
                        placeholder="Approximate size of affected area"
                        className="h-12 text-base mt-2 bg-white"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Camera className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">Photos</h2>
                  </div>
                  <IssuePhotoForm
                    selectedPhotos={selectedPhotos}
                    uploading={uploading}
                    onPhotoUpload={handlePhotoUpload}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t">
                <Button type="submit" disabled={uploading} size="lg" className="px-8">
                  Create Issue
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </Card>

      <Card className="p-6 border-none shadow-lg bg-gradient-to-br from-white to-gray-50">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">Issue Preview</h3>
          <div className="space-y-6">
            {selectedPhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {selectedPhotos.map((photo) => (
                  <div key={photo} className="relative group overflow-hidden rounded-lg">
                    <img
                      src={photo}
                      alt="Issue preview"
                      className="rounded-lg object-cover aspect-video w-full transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No photos uploaded</p>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Title</h4>
                <p className="text-muted-foreground">{form.watch("title") || "No title"}</p>
              </div>

              <div>
                <h4 className="font-medium mb-1">Description</h4>
                <p className="text-muted-foreground">{form.watch("description") || "No description"}</p>
              </div>

              {selectedType && (
                <div>
                  <h4 className="font-medium mb-1">Required Photos</h4>
                  <p className="text-muted-foreground">
                    {selectedPhotos.length} of {selectedType.requiredPhotos} photos uploaded
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

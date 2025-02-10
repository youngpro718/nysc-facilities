
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
import { Building2, Camera, FileText, MapPin, Image, Info } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-[#E5DEFF] to-white p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-none shadow-xl bg-white backdrop-blur-xl bg-opacity-90">
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8 p-6">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-purple-100">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <FileText className="w-5 h-5 text-primary-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-800">Issue Details</h2>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-transparent p-6 rounded-xl">
                      <IssueTypeForm form={form} />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pb-4 border-b border-purple-100">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <Info className="w-5 h-5 text-primary-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">Description</h2>
                      </div>
                      <div className="space-y-4 p-6 bg-white rounded-xl shadow-sm">
                        <div className="group">
                          <Label className="text-base font-medium text-gray-700 group-hover:text-primary-600 transition-colors">
                            Title
                          </Label>
                          <Input 
                            placeholder="Enter a descriptive title" 
                            {...form.register("title")}
                            className="h-12 text-base mt-2 border-gray-200 focus:border-primary-600 transition-colors"
                          />
                        </div>
                        <div className="group">
                          <Label className="text-base font-medium text-gray-700 group-hover:text-primary-600 transition-colors">
                            Description
                          </Label>
                          <Textarea 
                            placeholder="Provide detailed information about the issue" 
                            {...form.register("description")}
                            className="min-h-[120px] text-base mt-2 border-gray-200 focus:border-primary-600 transition-colors resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pb-4 border-b border-purple-100">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <MapPin className="w-5 h-5 text-primary-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">Location</h2>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-transparent p-6 rounded-xl">
                        <IssueLocationForm
                          form={form}
                          selectedBuilding={selectedBuilding}
                          selectedFloor={selectedFloor}
                          setSelectedBuilding={setSelectedBuilding}
                          setSelectedFloor={setSelectedFloor}
                        />
                      </div>
                    </div>

                    {selectedType?.contextFields.includes("temperature") && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 pb-4 border-b border-purple-100">
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <Building2 className="w-5 h-5 text-primary-600" />
                          </div>
                          <h2 className="text-xl font-semibold text-gray-800">Temperature</h2>
                        </div>
                        <div className="p-6 bg-white rounded-xl shadow-sm">
                          <Label className="text-base font-medium text-gray-700">Temperature (°F)</Label>
                          <Input 
                            type="number" 
                            {...form.register("temperature")}
                            className="h-12 text-base mt-2 border-gray-200 focus:border-primary-600 transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {selectedType?.contextFields.includes("damage_assessment") && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 pb-4 border-b border-purple-100">
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <Building2 className="w-5 h-5 text-primary-600" />
                          </div>
                          <h2 className="text-xl font-semibold text-gray-800">Damage Assessment</h2>
                        </div>
                        <div className="p-6 bg-white rounded-xl shadow-sm">
                          <Label className="text-base font-medium text-gray-700">Assessment Details</Label>
                          <Textarea 
                            {...form.register("damage_assessment")}
                            placeholder="Describe the extent of damage"
                            className="min-h-[100px] text-base mt-2 border-gray-200 focus:border-primary-600 transition-colors resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {selectedType?.contextFields.includes("area_size") && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 pb-4 border-b border-purple-100">
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <Building2 className="w-5 h-5 text-primary-600" />
                          </div>
                          <h2 className="text-xl font-semibold text-gray-800">Area Details</h2>
                        </div>
                        <div className="p-6 bg-white rounded-xl shadow-sm">
                          <Label className="text-base font-medium text-gray-700">Area Size</Label>
                          <Input 
                            {...form.register("area_size")}
                            placeholder="Approximate size of affected area"
                            className="h-12 text-base mt-2 border-gray-200 focus:border-primary-600 transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pb-4 border-b border-purple-100">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <Camera className="w-5 h-5 text-primary-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">Photos</h2>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-transparent p-6 rounded-xl">
                        <IssuePhotoForm
                          selectedPhotos={selectedPhotos}
                          uploading={uploading}
                          onPhotoUpload={handlePhotoUpload}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="sticky bottom-0 flex justify-end pt-6 pb-4 border-t bg-white/80 backdrop-blur-lg">
                    <Button 
                      type="submit" 
                      disabled={uploading} 
                      size="lg" 
                      className={cn(
                        "px-8 bg-primary-600 hover:bg-primary-700 text-white",
                        "transition-all duration-200 transform hover:scale-105",
                        "shadow-lg hover:shadow-xl",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      Create Issue
                    </Button>
                  </div>
                </form>
              </Form>
            </ScrollArea>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-6 border-none shadow-xl bg-white backdrop-blur-xl bg-opacity-90">
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-purple-100">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Image className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Preview</h3>
              </div>

              <div className="space-y-6">
                {selectedPhotos.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {selectedPhotos.map((photo) => (
                      <div key={photo} className="group relative overflow-hidden rounded-xl">
                        <img
                          src={photo}
                          alt="Issue preview"
                          className="w-full aspect-video object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 border-2 border-dashed">
                    <div className="text-center">
                      <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No photos uploaded</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Title</h4>
                    <p className="text-gray-600">{form.watch("title") || "No title"}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Description</h4>
                    <p className="text-gray-600">{form.watch("description") || "No description"}</p>
                  </div>

                  {selectedType && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">Required Photos</h4>
                      <div className="flex items-center gap-2">
                        <div className="h-2 bg-primary-100 rounded-full flex-1">
                          <div 
                            className="h-2 bg-primary-600 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${(selectedPhotos.length / selectedType.requiredPhotos) * 100}%`,
                              maxWidth: '100%'
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {selectedPhotos.length} of {selectedType.requiredPhotos}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


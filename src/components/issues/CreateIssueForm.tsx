
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { issueTypes } from "./wizard/IssueTypeSelection";
import { FormData } from "./types/IssueTypes";
import { IssueLocationForm } from "./wizard/IssueLocationForm";
import { IssueTypeForm } from "./wizard/IssueTypeForm";
import { IssuePhotoForm } from "./wizard/IssuePhotoForm";
import { usePhotoUpload } from "./hooks/usePhotoUpload";
import { ScrollArea } from "../ui/scroll-area";

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
      toast.error(`Please upload at least ${selectedType.requiredPhotos} photo${selectedType.requiredPhotos > 1 ? 's' : ''}`);
      return;
    }
    await onSubmit({ ...data, photos: selectedPhotos });
  };

  return (
    <div className="grid grid-cols-2 gap-6 p-6">
      <Card className="p-6">
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="space-y-4">
              <IssueTypeForm form={form} />
              
              <div className="space-y-4">
                <Label>Details</Label>
                <Input 
                  placeholder="Title" 
                  {...form.register("title")}
                  className="h-12 text-base"
                />
                <Textarea 
                  placeholder="Description" 
                  {...form.register("description")}
                  className="min-h-[120px] text-base"
                />
              </div>

              <IssueLocationForm
                form={form}
                selectedBuilding={selectedBuilding}
                selectedFloor={selectedFloor}
                setSelectedBuilding={setSelectedBuilding}
                setSelectedFloor={setSelectedFloor}
              />

              {selectedType?.contextFields.includes("temperature") && (
                <div className="space-y-2">
                  <Label>Temperature (°F)</Label>
                  <Input 
                    type="number" 
                    {...form.register("temperature")}
                    className="h-12 text-base"
                  />
                </div>
              )}

              {selectedType?.contextFields.includes("damage_assessment") && (
                <div className="space-y-2">
                  <Label>Damage Assessment</Label>
                  <Textarea 
                    {...form.register("damage_assessment")}
                    placeholder="Describe the extent of damage"
                    className="min-h-[100px] text-base"
                  />
                </div>
              )}

              {selectedType?.contextFields.includes("area_size") && (
                <div className="space-y-2">
                  <Label>Area Size</Label>
                  <Input 
                    {...form.register("area_size")}
                    placeholder="Approximate size of affected area"
                    className="h-12 text-base"
                  />
                </div>
              )}

              <IssuePhotoForm
                selectedPhotos={selectedPhotos}
                uploading={uploading}
                onPhotoUpload={handlePhotoUpload}
              />
            </div>

            <div className="flex justify-end pt-6">
              <Button type="submit" disabled={uploading}>
                Create Issue
              </Button>
            </div>
          </form>
        </ScrollArea>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Issue Preview</h3>
          {selectedPhotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {selectedPhotos.map((photo) => (
                <img
                  key={photo}
                  src={photo}
                  alt="Issue preview"
                  className="rounded-md object-cover aspect-video w-full"
                />
              ))}
            </div>
          ) : (
            <div className="aspect-video bg-muted rounded-md flex items-center justify-center text-muted-foreground">
              No photos uploaded
            </div>
          )}
          
          <div className="space-y-2">
            <h4 className="font-medium">Title</h4>
            <p className="text-muted-foreground">{form.watch("title") || "No title"}</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Description</h4>
            <p className="text-muted-foreground">{form.watch("description") || "No description"}</p>
          </div>

          {selectedType && (
            <div className="space-y-2">
              <h4 className="font-medium">Required Photos</h4>
              <p className="text-muted-foreground">
                {selectedPhotos.length} of {selectedType.requiredPhotos} photos uploaded
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

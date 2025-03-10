
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Trash2, Image } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RoomFormData } from "./RoomFormSchema";

interface CourtroomPhotoUploadProps {
  form: UseFormReturn<RoomFormData>;
}

export function CourtroomPhotoUpload({ form }: CourtroomPhotoUploadProps) {
  const roomType = form.watch("roomType");
  const courtRoomPhotos = form.watch("courtRoomPhotos") || { judge_view: null, audience_view: null };
  
  // Only show for courtrooms
  if (roomType !== "courtroom") {
    return null;
  }

  const handlePhotoChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    viewType: "judge_view" | "audience_view"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Convert to base64 for preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const updatedPhotos = {
          ...courtRoomPhotos,
          [viewType]: event.target.result as string
        };
        form.setValue("courtRoomPhotos", updatedPhotos, { shouldValidate: true });
      }
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (viewType: "judge_view" | "audience_view") => {
    const updatedPhotos = {
      ...courtRoomPhotos,
      [viewType]: null
    };
    form.setValue("courtRoomPhotos", updatedPhotos, { shouldValidate: true });
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="courtRoomPhotos"
        render={() => (
          <FormItem>
            <FormLabel>Courtroom Photos</FormLabel>
            <FormDescription>
              Upload photos showing different views of the courtroom
            </FormDescription>
            <FormControl>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Judge View Upload */}
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Judge's View</h4>
                      {courtRoomPhotos?.judge_view ? (
                        <div className="relative aspect-video rounded-md overflow-hidden border">
                          <img
                            src={courtRoomPhotos.judge_view}
                            alt="Judge's View"
                            className="object-cover w-full h-full"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => removePhoto("judge_view")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 p-4 border rounded-md border-dashed">
                          <Image className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Upload Judge's View Photo</p>
                          <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="judge-view-upload"
                            onChange={(e) => handlePhotoChange(e, "judge_view")}
                          />
                          <label htmlFor="judge-view-upload">
                            <Button type="button" variant="outline" size="sm" asChild>
                              <span>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload
                              </span>
                            </Button>
                          </label>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Audience View Upload */}
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Audience View</h4>
                      {courtRoomPhotos?.audience_view ? (
                        <div className="relative aspect-video rounded-md overflow-hidden border">
                          <img
                            src={courtRoomPhotos.audience_view}
                            alt="Audience View"
                            className="object-cover w-full h-full"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => removePhoto("audience_view")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 p-4 border rounded-md border-dashed">
                          <Image className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Upload Audience View Photo</p>
                          <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="audience-view-upload"
                            onChange={(e) => handlePhotoChange(e, "audience_view")}
                          />
                          <label htmlFor="audience-view-upload">
                            <Button type="button" variant="outline" size="sm" asChild>
                              <span>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload
                              </span>
                            </Button>
                          </label>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}

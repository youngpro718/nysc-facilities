
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoomFormProps } from "./types";

export function CourtroomPhotoUpload({ form }: RoomFormProps) {
  const [isUploading, setIsUploading] = useState<{
    judge_view: boolean;
    audience_view: boolean;
  }>({
    judge_view: false,
    audience_view: false,
  });
  const { toast } = useToast();
  
  // Get current values or provide defaults
  const courtroomPhotos = form.watch("courtroomPhotos") || { judge_view: null, audience_view: null };

  // Handle file upload for a specific view type (judge_view or audience_view)
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, viewType: "judge_view" | "audience_view") => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        setIsUploading((prev) => ({ ...prev, [viewType]: true }));

        // Create file path
        const fileExt = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `courtroom-photos/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("courtroom-photos")
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data } = supabase.storage
          .from("courtroom-photos")
          .getPublicUrl(filePath);

        // Update form value - maintain the existing value for the other view
        const updatedPhotos = {
          ...courtroomPhotos,
          [viewType]: data.publicUrl,
        };
        
        form.setValue("courtroomPhotos", updatedPhotos, {
          shouldValidate: true,
          shouldDirty: true,
        });

        toast({
          title: "Upload successful",
          description: "Photo has been uploaded successfully.",
        });
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          title: "Upload failed",
          description: "There was a problem uploading your photo.",
          variant: "destructive",
        });
      } finally {
        setIsUploading((prev) => ({ ...prev, [viewType]: false }));
      }
    },
    [form, toast, courtroomPhotos]
  );

  // Handle file deletion for a specific view type
  const handleDelete = useCallback(
    async (viewType: "judge_view" | "audience_view") => {
      try {
        // Extract file path from URL
        const currentUrl = viewType === "judge_view" 
            ? courtroomPhotos.judge_view 
            : courtroomPhotos.audience_view;
            
        if (!currentUrl) return;

        const filePathMatch = currentUrl.match(/courtroom-photos\/(.+)$/);
        if (!filePathMatch || !filePathMatch[1]) {
          throw new Error("Invalid file path");
        }

        const filePath = filePathMatch[1];

        // Delete from Supabase Storage
        const { error: deleteError } = await supabase.storage
          .from("courtroom-photos")
          .remove([filePath]);

        if (deleteError) {
          throw deleteError;
        }

        // Update form value - maintain the existing value for the other view
        const updatedPhotos = {
          ...courtroomPhotos,
          [viewType]: null,
        };
        
        form.setValue("courtroomPhotos", updatedPhotos, {
          shouldValidate: true,
          shouldDirty: true,
        });

        toast({
          title: "Photo deleted",
          description: "Photo has been removed successfully.",
        });
      } catch (error) {
        console.error("Delete error:", error);
        toast({
          title: "Delete failed",
          description: "There was a problem deleting the photo.",
          variant: "destructive",
        });
      }
    },
    [form, toast, courtroomPhotos]
  );

  return (
    <FormField
      control={form.control}
      name="courtroomPhotos"
      render={() => (
        <FormItem>
          <FormLabel>Courtroom Photos</FormLabel>
          <FormControl>
            <Tabs defaultValue="judge_view" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="judge_view">Judge View</TabsTrigger>
                <TabsTrigger value="audience_view">Audience View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="judge_view">
                <Card>
                  <CardContent className="pt-6">
                    <FormField
                      control={form.control}
                      name="courtroomPhotos.judge_view"
                      render={() => (
                        <div className="flex flex-col items-center">
                          {courtroomPhotos.judge_view ? (
                            <div className="relative w-full">
                              <img
                                src={courtroomPhotos.judge_view}
                                alt="Judge view"
                                className="w-full h-auto object-cover rounded-md"
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={() => handleDelete("judge_view")}
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="w-full p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center">
                              <ImagePlus className="h-10 w-10 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground mb-2">
                                Upload a photo of the judge view
                              </p>
                              <Button
                                variant="outline"
                                disabled={isUploading.judge_view}
                                onClick={() => document.getElementById("judge_view_upload")?.click()}
                                type="button"
                              >
                                {isUploading.judge_view ? "Uploading..." : "Upload"}
                              </Button>
                              <input
                                id="judge_view_upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, "judge_view")}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="audience_view">
                <Card>
                  <CardContent className="pt-6">
                    <FormField
                      control={form.control}
                      name="courtroomPhotos.audience_view"
                      render={() => (
                        <div className="flex flex-col items-center">
                          {courtroomPhotos.audience_view ? (
                            <div className="relative w-full">
                              <img
                                src={courtroomPhotos.audience_view}
                                alt="Audience view"
                                className="w-full h-auto object-cover rounded-md"
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={() => handleDelete("audience_view")}
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="w-full p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center">
                              <ImagePlus className="h-10 w-10 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground mb-2">
                                Upload a photo of the audience view
                              </p>
                              <Button
                                variant="outline"
                                disabled={isUploading.audience_view}
                                onClick={() => document.getElementById("audience_view_upload")?.click()}
                                type="button"
                              >
                                {isUploading.audience_view ? "Uploading..." : "Upload"}
                              </Button>
                              <input
                                id="audience_view_upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, "audience_view")}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

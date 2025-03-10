
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RoomFormData } from "./RoomFormSchema";

interface PhotoUploadProps {
  form: UseFormReturn<RoomFormData>;
}

export function CourtroomPhotoUpload({ form }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const courtRoomPhotos = form.watch("courtRoomPhotos") || { judge_view: null, audience_view: null };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, viewType: 'judge_view' | 'audience_view') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Create a unique file name with timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `courtroom-photos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('room-photos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('room-photos')
        .getPublicUrl(filePath);

      if (urlData) {
        // Update the form state with the new photo URL
        const updatedPhotos = {
          ...courtRoomPhotos,
          [viewType]: urlData.publicUrl
        };
        form.setValue("courtRoomPhotos", updatedPhotos);
        toast.success(`${viewType === 'judge_view' ? 'Judge' : 'Audience'} view photo uploaded successfully`);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (viewType: 'judge_view' | 'audience_view') => {
    const updatedPhotos = {
      ...courtRoomPhotos,
      [viewType]: null
    };
    form.setValue("courtRoomPhotos", updatedPhotos);
    toast.success(`${viewType === 'judge_view' ? 'Judge' : 'Audience'} view photo removed`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Courtroom Photos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Judge View Upload */}
          <FormField
            control={form.control}
            name="courtRoomPhotos.judge_view"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Judge View</FormLabel>
                <FormControl>
                  <div className="flex flex-col items-center">
                    {courtRoomPhotos?.judge_view ? (
                      <div className="relative w-full">
                        <img 
                          src={courtRoomPhotos.judge_view} 
                          alt="Judge View" 
                          className="w-full h-48 object-cover rounded-md" 
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => removePhoto('judge_view')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-md p-8 w-full flex flex-col items-center">
                        <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">Upload Judge View Photo</p>
                        <div className="relative">
                          <Button 
                            type="button" 
                            disabled={isUploading} 
                            className="relative"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {isUploading ? 'Uploading...' : 'Upload'}
                            <input
                              type="file"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'judge_view')}
                              disabled={isUploading}
                            />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Audience View Upload */}
          <FormField
            control={form.control}
            name="courtRoomPhotos.audience_view"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Audience View</FormLabel>
                <FormControl>
                  <div className="flex flex-col items-center">
                    {courtRoomPhotos?.audience_view ? (
                      <div className="relative w-full">
                        <img 
                          src={courtRoomPhotos.audience_view} 
                          alt="Audience View" 
                          className="w-full h-48 object-cover rounded-md" 
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => removePhoto('audience_view')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-md p-8 w-full flex flex-col items-center">
                        <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">Upload Audience View Photo</p>
                        <div className="relative">
                          <Button 
                            type="button" 
                            disabled={isUploading} 
                            className="relative"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {isUploading ? 'Uploading...' : 'Upload'}
                            <input
                              type="file"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'audience_view')}
                              disabled={isUploading}
                            />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

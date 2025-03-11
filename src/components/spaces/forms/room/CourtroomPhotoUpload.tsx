
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "./RoomFormSchema";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import Image from 'next/image';

interface CourtroomPhotoUploadProps {
  form: UseFormReturn<RoomFormData>;
}

export function CourtroomPhotoUpload({ form }: CourtroomPhotoUploadProps) {
  const [uploading, setUploading] = useState({
    judge: false,
    audience: false
  });
  
  const courtRoomPhotos = form.watch("courtRoomPhotos");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, view: 'judge_view' | 'audience_view') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Start upload loading state
      setUploading(prev => ({
        ...prev,
        [view === 'judge_view' ? 'judge' : 'audience']: true
      }));

      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError, data } = await supabase.storage
        .from('courtroom-photos')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('courtroom-photos')
        .getPublicUrl(filePath);

      // Update form value
      const updatedPhotos = {
        ...(courtRoomPhotos || { judge_view: null, audience_view: null }),
        [view]: publicUrl
      };
      
      form.setValue("courtRoomPhotos", updatedPhotos, { shouldValidate: true });
      toast.success(`${view === 'judge_view' ? 'Judge view' : 'Audience view'} photo uploaded successfully`);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error(`Failed to upload photo: ${error.message}`);
    } finally {
      // End upload loading state
      setUploading(prev => ({
        ...prev,
        [view === 'judge_view' ? 'judge' : 'audience']: false
      }));
      
      // Clear the input value to allow uploading the same file again
      event.target.value = '';
    }
  };

  const handleRemovePhoto = (view: 'judge_view' | 'audience_view') => {
    if (!courtRoomPhotos?.[view]) return;
    
    try {
      // Get the filename from the URL
      const url = courtRoomPhotos[view] as string;
      const fileName = url.split('/').pop();
      
      // Delete the file from storage if it exists
      if (fileName) {
        supabase.storage
          .from('courtroom-photos')
          .remove([fileName])
          .then(({ error }) => {
            if (error) {
              console.error('Error removing file from storage:', error);
            }
          });
      }
      
      // Update form state (immediately, don't wait for storage deletion)
      const updatedPhotos = { ...courtRoomPhotos, [view]: null };
      form.setValue("courtRoomPhotos", updatedPhotos, { shouldValidate: true });
      toast.success(`${view === 'judge_view' ? 'Judge view' : 'Audience view'} photo removed`);
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error(`Failed to remove photo: ${error.message}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Courtroom Photos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Judge View Photo */}
          <FormField
            control={form.control}
            name="courtRoomPhotos.judge_view"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Judge View</FormLabel>
                <div className="mt-2">
                  {courtRoomPhotos?.judge_view ? (
                    <div className="relative w-full h-48 rounded-md overflow-hidden border">
                      <img 
                        src={courtRoomPhotos.judge_view as string} 
                        alt="Judge View" 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => handleRemovePhoto('judge_view')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border border-dashed rounded-md cursor-pointer bg-background hover:bg-accent/50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {uploading.judge ? (
                            <span className="flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </span>
                          ) : (
                            <span>Click to upload judge view photo</span>
                          )}
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'judge_view')}
                        disabled={uploading.judge}
                      />
                    </label>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Audience View Photo */}
          <FormField
            control={form.control}
            name="courtRoomPhotos.audience_view"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Audience View</FormLabel>
                <div className="mt-2">
                  {courtRoomPhotos?.audience_view ? (
                    <div className="relative w-full h-48 rounded-md overflow-hidden border">
                      <img 
                        src={courtRoomPhotos.audience_view as string} 
                        alt="Audience View" 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => handleRemovePhoto('audience_view')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border border-dashed rounded-md cursor-pointer bg-background hover:bg-accent/50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {uploading.audience ? (
                            <span className="flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </span>
                          ) : (
                            <span>Click to upload audience view photo</span>
                          )}
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'audience_view')}
                        disabled={uploading.audience}
                      />
                    </label>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

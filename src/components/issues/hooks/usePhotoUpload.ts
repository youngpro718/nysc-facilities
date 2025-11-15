
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const usePhotoUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    setUploading(true);
    const files = Array.from(event.target.files);
    const uploadedPhotos: string[] = [];

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('issue-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('issue-photos')
          .getPublicUrl(filePath);

        uploadedPhotos.push(publicUrl);
      }

      setSelectedPhotos([...selectedPhotos, ...uploadedPhotos]);
      toast.success("Photos uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload photos");
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    selectedPhotos,
    setSelectedPhotos,
    handlePhotoUpload
  };
};

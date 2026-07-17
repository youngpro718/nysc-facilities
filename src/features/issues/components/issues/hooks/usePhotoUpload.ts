
import { useState } from "react";
import { getErrorMessage } from "@/lib/errorUtils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { STORAGE_BUCKETS } from '@/config';

export const usePhotoUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = event.target;
    if (!inputEl.files || inputEl.files.length === 0) return;

    setUploading(true);
    const files = Array.from(inputEl.files);
    const uploadedPhotos: string[] = [];

    try {
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 10MB limit`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const filePath = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.issuePhotos)
          .upload(filePath, file, { contentType: file.type });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(STORAGE_BUCKETS.issuePhotos)
          .getPublicUrl(filePath);

        uploadedPhotos.push(publicUrl);
      }

      if (uploadedPhotos.length > 0) {
        setSelectedPhotos((prev) => [...prev, ...uploadedPhotos]);
        toast.success("Photos uploaded successfully");
      }
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to upload photos");
    } finally {
      setUploading(false);
      // Reset so selecting the same file(s) again still fires onChange —
      // browsers only fire it when the input's value actually changes.
      inputEl.value = "";
    }
  };

  return {
    uploading,
    selectedPhotos,
    setSelectedPhotos,
    handlePhotoUpload
  };
};

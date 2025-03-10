
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Image, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { RoomFormData } from './RoomFormSchema';

export function CourtroomPhotoUpload({ form }: { form: UseFormReturn<RoomFormData> }) {
  const [uploading, setUploading] = useState<{ judge?: boolean; audience?: boolean }>({});
  const courtRoomPhotos = form.watch('courtRoomPhotos');

  const uploadPhoto = async (file: File, type: 'judge_view' | 'audience_view') => {
    try {
      setUploading(prev => ({ ...prev, [type === 'judge_view' ? 'judge' : 'audience']: true }));
      
      // Try to create the bucket if it doesn't exist
      const { error: bucketError } = await supabase.storage.createBucket('courtroom-photos', {
        public: true,
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (bucketError && bucketError.message !== 'Duplicate name') {
        console.error('Error creating bucket:', bucketError);
        toast.error('Failed to create storage bucket');
      }
      
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      
      // Upload the file
      const { data, error } = await supabase.storage
        .from('courtroom-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        throw error;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('courtroom-photos')
        .getPublicUrl(fileName);

      // Update the form with the photo URL
      const currentPhotos = form.getValues('courtRoomPhotos') || {};
      form.setValue('courtRoomPhotos', {
        ...currentPhotos,
        [type]: urlData.publicUrl
      }, { shouldDirty: true });

      toast.success(`${type === 'judge_view' ? 'Judge view' : 'Audience view'} photo uploaded`);
    } catch (error: any) {
      console.error(`Error uploading photo:`, error);
      toast.error(`Failed to upload photo: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(prev => ({ ...prev, [type === 'judge_view' ? 'judge' : 'audience']: false }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'judge_view' | 'audience_view') => {
    if (e.target.files && e.target.files[0]) {
      uploadPhoto(e.target.files[0], type);
    }
  };

  const clearPhoto = (type: 'judge_view' | 'audience_view') => {
    const currentPhotos = form.getValues('courtRoomPhotos') || {};
    form.setValue('courtRoomPhotos', {
      ...currentPhotos,
      [type]: null
    }, { shouldDirty: true });
  };

  return (
    <div className="grid gap-4">
      <h3 className="text-lg font-medium">Courtroom Photos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormItem>
          <FormLabel>Judge's View</FormLabel>
          <div className="flex flex-col gap-2">
            {courtRoomPhotos?.judge_view ? (
              <div className="relative border rounded-md overflow-hidden h-40">
                <img 
                  src={courtRoomPhotos.judge_view} 
                  alt="Judge's View" 
                  className="object-cover w-full h-full"
                />
                <Button 
                  type="button"
                  variant="destructive" 
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => clearPhoto('judge_view')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'judge_view')}
                  disabled={uploading.judge}
                />
                {uploading.judge && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </div>
            )}
          </div>
        </FormItem>

        <FormItem>
          <FormLabel>Audience View</FormLabel>
          <div className="flex flex-col gap-2">
            {courtRoomPhotos?.audience_view ? (
              <div className="relative border rounded-md overflow-hidden h-40">
                <img 
                  src={courtRoomPhotos.audience_view} 
                  alt="Audience View" 
                  className="object-cover w-full h-full"
                />
                <Button 
                  type="button"
                  variant="destructive" 
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => clearPhoto('audience_view')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'audience_view')}
                  disabled={uploading.audience}
                />
                {uploading.audience && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </div>
            )}
          </div>
        </FormItem>
      </div>
    </div>
  );
}

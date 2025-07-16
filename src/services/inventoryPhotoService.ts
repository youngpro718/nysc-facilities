import { supabase } from "@/integrations/supabase/client";

export class InventoryPhotoService {
  private static bucketName = 'inventory-photos';

  static async uploadPhoto(
    file: File, 
    itemId: string, 
    userId: string
  ): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${itemId}/${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  }

  static async deletePhoto(url: string): Promise<boolean> {
    try {
      // Extract file path from URL
      const urlParts = url.split('/');
      const fileName = urlParts.slice(-3).join('/'); // Get itemId/userId/filename.ext

      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([fileName]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting photo:', error);
      return false;
    }
  }

  static async updateItemPhoto(itemId: string, photoUrl: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({ photo_url: photoUrl })
        .eq('id', itemId);

      if (error) {
        console.error('Error updating item photo:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating item photo:', error);
      return false;
    }
  }
}
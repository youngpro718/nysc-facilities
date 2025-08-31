import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

interface ItemPhotoUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
  currentPhotoUrl?: string;
  onPhotoUploaded: (url: string) => void;
}

export function ItemPhotoUpload({
  open,
  onOpenChange,
  itemId,
  itemName,
  currentPhotoUrl,
  onPhotoUploaded,
}: ItemPhotoUploadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${itemId}-${Date.now()}.${fileExt}`;
      const filePath = `inventory-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('inventory-photos')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from('inventory-photos')
        .getPublicUrl(filePath);

      // Update item with photo URL
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ photo_url: publicUrl.publicUrl })
        .eq('id', itemId);

      if (updateError) throw updateError;

      // Invalidate inventory queries to trigger re-fetch
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      
      onPhotoUploaded(publicUrl.publicUrl);
      onOpenChange(false);
      
      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentPhotoUrl) return;

    try {
      // Extract file path from URL
      const urlParts = currentPhotoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `inventory-photos/${fileName}`;

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('inventory-photos')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Update item to remove photo URL
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ photo_url: null })
        .eq('id', itemId);

      if (updateError) throw updateError;

      // Invalidate inventory queries to trigger re-fetch
      queryClient.invalidateQueries({ queryKey: ["inventory"] });

      onPhotoUploaded('');
      onOpenChange(false);
      
      toast({
        title: "Success",
        description: "Photo removed successfully",
      });
    } catch (error: any) {
      console.error('Remove error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove photo",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photo for {itemName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Photo */}
          {currentPhotoUrl && (
            <div className="space-y-2">
              <Label>Current Photo</Label>
              <div className="relative">
                <img
                  src={currentPhotoUrl}
                  alt={itemName}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={handleRemovePhoto}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Preview */}
          {previewUrl && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg border"
              />
            </div>
          )}

          {/* Upload Controls */}
          <div className="space-y-2">
            <Label htmlFor="photo-upload">
              {currentPhotoUrl ? "Replace Photo" : "Upload Photo"}
            </Label>
            <Input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
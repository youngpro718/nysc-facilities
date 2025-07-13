import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, X, Camera, UserPlus } from 'lucide-react';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { useAuth } from '@/hooks/useAuth';

interface AvatarPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function AvatarPromptModal({ open, onOpenChange, onComplete }: AvatarPromptModalProps) {
  const { user, profile, refreshSession } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);

  const {
    uploading,
    previewUrl,
    fileInputRef,
    handleFileSelect,
    uploadAvatar,
    resetPreview,
    openFileDialog
  } = useAvatarUpload({
    onSuccess: async () => {
      await refreshSession();
      onComplete?.();
      onOpenChange(false);
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return;
    
    setIsCompleting(true);
    await uploadAvatar(fileInputRef.current.files[0]);
    setIsCompleting(false);
  };

  const handleSkip = () => {
    onComplete?.();
    onOpenChange(false);
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            Add a profile picture to help others recognize you in the system
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex justify-center">
            <Avatar className="w-24 h-24 ring-2 ring-primary/20">
              <AvatarImage src={previewUrl || profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xl">
                {previewUrl || profile?.avatar_url ? null : getInitials()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {!previewUrl ? (
              <Button
                variant="outline"
                onClick={openFileDialog}
                className="w-full"
                disabled={uploading}
              >
                <Camera className="h-4 w-4 mr-2" />
                Choose Profile Picture
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={openFileDialog}
                    className="flex-1"
                    disabled={uploading || isCompleting}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetPreview}
                    disabled={uploading || isCompleting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button
                  onClick={handleUpload}
                  disabled={uploading || isCompleting}
                  className="w-full"
                >
                  {uploading || isCompleting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload Profile Picture
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="flex-1"
              disabled={uploading || isCompleting}
            >
              Skip for Now
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>Supported formats: JPG, PNG, GIF, WebP</p>
            <p>Maximum size: 5MB</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
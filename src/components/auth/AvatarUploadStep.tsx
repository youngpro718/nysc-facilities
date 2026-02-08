import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Camera } from 'lucide-react';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';

interface AvatarUploadStepProps {
  firstName: string;
  lastName: string;
  onAvatarSelect?: (file: File | null) => void;
  className?: string;
}

export function AvatarUploadStep({ 
  firstName, 
  lastName, 
  onAvatarSelect,
  className = ""
}: AvatarUploadStepProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    previewUrl,
    fileInputRef,
    handleFileSelect,
    resetPreview,
    openFileDialog
  } = useAvatarUpload();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
      setSelectedFile(file);
      onAvatarSelect?.(file);
    }
  };

  const handleRemove = () => {
    resetPreview();
    setSelectedFile(null);
    onAvatarSelect?.(null);
  };

  const getInitials = () => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center space-y-4">
        <Avatar className="w-24 h-24 mx-auto ring-2 ring-slate-200">
          <AvatarImage src={previewUrl || undefined} />
          <AvatarFallback className="text-xl font-semibold bg-slate-100 dark:bg-slate-800/30 text-slate-700">
            {firstName && lastName ? getInitials() : <Camera className="w-8 h-8" />}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-2">
          <Label className="text-slate-700 text-sm font-medium">
            Profile Picture (Optional)
          </Label>
          <p className="text-slate-600 text-xs">
            Add a profile photo to help others recognize you
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {!previewUrl ? (
          <Button
            type="button"
            variant="outline"
            onClick={openFileDialog}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose Photo
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={openFileDialog}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Change Photo
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleRemove}
              className=""
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-500 text-center space-y-1">
        <p>Supported: JPG, PNG, GIF, WebP</p>
        <p>Maximum size: 5MB</p>
      </div>
    </div>
  );
}
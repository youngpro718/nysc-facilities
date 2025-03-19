
import React from 'react';
import { ProblemTypeField } from "../../form-sections/ProblemTypeField";
import { DescriptionField } from "../../form-sections/DescriptionField";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Camera, X, Loader2 } from "lucide-react";
import { WizardStepProps } from '../types';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";

interface DetailsStepProps extends WizardStepProps {
  isEmergency: boolean;
  setIsEmergency: (value: boolean) => void;
  selectedPhotos: string[];
  setSelectedPhotos: (photos: string[]) => void;
  uploading: boolean;
  handlePhotoUpload: (files: FileList) => Promise<void>;
}

export function DetailsStep({ 
  form, 
  isEmergency, 
  setIsEmergency,
  selectedPhotos,
  setSelectedPhotos,
  uploading,
  handlePhotoUpload
}: DetailsStepProps) {
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      await handlePhotoUpload(event.target.files);
    }
  };

  const handlePhotoRemove = (index: number) => {
    setSelectedPhotos(selectedPhotos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Emergency Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="font-medium">Is this an emergency?</h3>
          <p className="text-sm text-muted-foreground">
            Emergency issues will be prioritized
          </p>
        </div>
        <Switch
          checked={isEmergency}
          onCheckedChange={setIsEmergency}
        />
      </div>

      {isEmergency && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Emergency issues will be addressed as soon as possible. Please only mark
            issues as emergency if they require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Problem Type */}
      <ProblemTypeField
        form={form}
      />

      {/* Description */}
      <DescriptionField form={form} />

      {/* Photo Upload */}
      <FormItem>
        <FormLabel className="text-base">Add Photos</FormLabel>
        <FormControl>
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="w-full cursor-pointer">
                <div className={cn(
                  "flex flex-col items-center justify-center w-full h-32",
                  "border-2 border-dashed rounded-lg",
                  "border-white/10 bg-background/50 hover:bg-background/70",
                  "transition-colors duration-200",
                  uploading && "opacity-50 cursor-not-allowed"
                )}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploading ? (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Uploading...
                        </p>
                      </>
                    ) : (
                      <>
                        <Camera className="w-8 h-8 mb-2 text-primary" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-medium">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>
              </label>
            </div>

            {selectedPhotos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {selectedPhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className={cn(
                        "absolute -top-2 -right-2 h-6 w-6",
                        "opacity-0 group-hover:opacity-100 transition-opacity",
                        "focus:opacity-100"
                      )}
                      onClick={() => handlePhotoRemove(index)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove photo {index + 1}</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    </div>
  );
}

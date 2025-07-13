
import React from 'react';
import { ProblemTypeField } from "../../form-sections/ProblemTypeField";
import { DescriptionField } from "../../form-sections/DescriptionField";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Camera, X, Loader2 } from "lucide-react";
import { WizardStepProps } from '../types/index';
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
        <FormLabel className="text-base font-semibold">Add Photos</FormLabel>
        <p className="text-sm text-muted-foreground mb-4">
          Photos help us understand and resolve the issue faster
        </p>
        <FormControl>
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="w-full cursor-pointer">
                <div className={cn(
                  "flex flex-col items-center justify-center w-full",
                  "h-32 sm:h-36 border-2 border-dashed rounded-xl",
                  "border-muted-foreground/25 bg-muted/30",
                  "hover:border-primary/50 hover:bg-primary/5",
                  "transition-all duration-300 ease-in-out",
                  uploading && "opacity-50 cursor-not-allowed",
                  !uploading && "hover:scale-[1.01]"
                )}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                    {uploading ? (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                        <p className="text-sm font-medium text-primary">
                          Uploading photos...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Please wait
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="p-3 rounded-full bg-primary/10 mb-3">
                          <Camera className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-center mb-1">
                          <span className="text-primary">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground text-center">
                          PNG, JPG, GIF up to 10MB • Multiple files supported
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
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {selectedPhotos.length} photo{selectedPhotos.length > 1 ? 's' : ''} added
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPhotos([])}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Remove all
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {selectedPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                        <img
                          src={photo}
                          alt={`Issue photo ${index + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className={cn(
                          "absolute -top-2 -right-2 h-6 w-6 shadow-lg",
                          "opacity-0 group-hover:opacity-100 sm:opacity-100",
                          "transition-opacity focus:opacity-100",
                          "touch-manipulation" // Better mobile touch handling
                        )}
                        onClick={() => handlePhotoRemove(index)}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove photo {index + 1}</span>
                      </Button>
                      <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    </div>
  );
}

import React from 'react';
import { LocationFields } from "../../form-sections/LocationFields";
import { ProblemTypeField } from "../../form-sections/ProblemTypeField";
import { DescriptionField } from "../../form-sections/DescriptionField";
import { IssuePhotoForm } from "../IssuePhotoForm";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useWizardContext } from '../hooks/useWizardContext';
import { WizardStepProps } from '../types';

export function DetailsStep({ form, onNext }: WizardStepProps) {
  const { 
    isEmergency, 
    setIsEmergency,
    selectedIssueType,
    useAssignedRoom,
    setUseAssignedRoom,
    handlePhotoUpload,
    uploading,
    selectedPhotos,
    setSelectedPhotos
  } = useWizardContext();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      await handlePhotoUpload(event.target.files);
    }
  };

  const handlePhotoRemove = (index: number) => {
    setSelectedPhotos(selectedPhotos.filter((_, i) => i !== index));
  };

  React.useEffect(() => {
    if (useAssignedRoom) {
      const roomId = form.getValues().room_id;
      if (!roomId) {
        setUseAssignedRoom(false);
      }
    }
  }, [useAssignedRoom, form, setUseAssignedRoom]);

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

      {/* Location Fields */}
      <LocationFields
        form={form}
        disableFields={useAssignedRoom}
      />

      {/* Problem Type */}
      <ProblemTypeField
        form={form}
      />

      {/* Description */}
      <DescriptionField form={form} />

      {/* Photo Upload */}
      <IssuePhotoForm
        onPhotoUpload={handleFileUpload}
        uploading={uploading}
        selectedPhotos={selectedPhotos}
        onPhotoRemove={handlePhotoRemove}
      />
    </div>
  );
}

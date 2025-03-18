
import React from 'react';
import { ProblemTypeField } from "../../form-sections/ProblemTypeField";
import { DescriptionField } from "../../form-sections/DescriptionField";
import { IssuePhotoForm } from "../IssuePhotoForm";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useWizardContext } from '../hooks/useWizardContext';
import { WizardStepProps } from '../types';
import { Card } from "@/components/ui/card";

export function DetailsStep({ form }: WizardStepProps) {
  const { 
    isEmergency, 
    setIsEmergency,
    selectedIssueType,
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

  return (
    <Card className="p-6 animate-fade-in">
      <h2 className="text-lg font-semibold mb-4">Describe the issue</h2>
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
        <IssuePhotoForm
          onPhotoUpload={handleFileUpload}
          uploading={uploading}
          selectedPhotos={selectedPhotos}
          onPhotoRemove={handlePhotoRemove}
        />
      </div>
    </Card>
  );
}

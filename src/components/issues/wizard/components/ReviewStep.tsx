import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWizardContext } from '../hooks/useWizardContext';
import { WizardStepProps } from '../types';
import { ISSUE_TYPES } from '../constants/issueTypes';

export function ReviewStep({ form, isLoading }: WizardStepProps) {
  const { isEmergency, selectedIssueType, selectedPhotos } = useWizardContext();
  const formValues = form.getValues();
  
  const selectedType = ISSUE_TYPES.find(type => type.id === selectedIssueType);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Review Your Issue Report</h2>
      
      <Card className="p-4 space-y-4">
        {/* Priority & Type */}
        <div className="flex items-center gap-2">
          {isEmergency && (
            <Badge variant="destructive">Emergency</Badge>
          )}
          {selectedType && (
            <Badge className={selectedType.color}>
              {selectedType.label}
            </Badge>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <h3 className="font-medium">Location</h3>
          <div className="text-sm text-muted-foreground">
            <p>Building: {formValues.building_name || 'Not specified'}</p>
            <p>Floor: {formValues.floor_name || 'Not specified'}</p>
            <p>Room: {formValues.room_name || 'Not specified'}</p>
          </div>
        </div>

        {/* Problem Type */}
        {formValues.problem_type && (
          <div className="space-y-2">
            <h3 className="font-medium">Problem Type</h3>
            <p className="text-sm text-muted-foreground">
              {formValues.problem_type}
            </p>
          </div>
        )}

        {/* Description */}
        <div className="space-y-2">
          <h3 className="font-medium">Description</h3>
          <ScrollArea className="h-24 rounded-md border p-2">
            <p className="text-sm text-muted-foreground">
              {formValues.description || 'No description provided'}
            </p>
          </ScrollArea>
        </div>

        {/* Photos */}
        {selectedPhotos.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Attached Photos</h3>
            <div className="flex gap-2 overflow-x-auto">
              {selectedPhotos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Issue photo ${index + 1}`}
                  className="h-20 w-20 object-cover rounded-md"
                />
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

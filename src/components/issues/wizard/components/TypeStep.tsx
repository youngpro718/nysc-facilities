
import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ISSUE_TYPES } from '../constants/issueTypes';
import { StandardizedIssueType } from '../../constants/issueTypes';
import { WizardStepProps } from '../types';

interface TypeStepProps extends WizardStepProps {
  selectedIssueType: StandardizedIssueType | null;
  setSelectedIssueType: (type: StandardizedIssueType | null) => void;
}

export function TypeStep({ form, selectedIssueType, setSelectedIssueType }: TypeStepProps) {
  const handleTypeSelect = (typeId: StandardizedIssueType) => {
    setSelectedIssueType(typeId);
    form.setValue('issue_type', typeId);
  };

  return (
    <div className="space-y-4">
      <RadioGroup
        value={selectedIssueType || ""}
        onValueChange={(value) => handleTypeSelect(value as StandardizedIssueType)}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {ISSUE_TYPES.map((type) => (
          <div key={type.id} className="relative">
            <RadioGroupItem
              value={type.id}
              id={`type-${type.id}`}
              className="absolute opacity-0 w-full h-full cursor-pointer inset-0"
            />
            <Label
              htmlFor={`type-${type.id}`}
              className={cn(
                "cursor-pointer block h-full",
                selectedIssueType === type.id && "ring-2 ring-primary"
              )}
            >
              <div className="p-4 hover:bg-accent transition-colors h-full border rounded-md flex flex-col items-center text-center gap-2">
                <span className={cn("rounded-full p-2", type.color)}>
                  {type.icon}
                </span>
                <div>
                  <h3 className="font-medium">{type.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    {type.description}
                  </p>
                </div>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

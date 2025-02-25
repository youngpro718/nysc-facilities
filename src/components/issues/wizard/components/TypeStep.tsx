import React from 'react';
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ISSUE_TYPES } from '../constants/issueTypes';
import { useWizardContext } from '../hooks/useWizardContext';
import { WizardStepProps } from '../types';

export function TypeStep({ form, onNext }: WizardStepProps) {
  const { selectedIssueType, setSelectedIssueType } = useWizardContext();

  const handleTypeSelect = (typeId: string) => {
    setSelectedIssueType(typeId as any);
    form.setValue('issue_type', typeId);
    onNext();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">What type of issue are you reporting?</h2>
      <RadioGroup
        value={selectedIssueType || undefined}
        onValueChange={handleTypeSelect}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {ISSUE_TYPES.map((type) => (
          <Label
            key={type.id}
            className={cn(
              "cursor-pointer",
              selectedIssueType === type.id && "ring-2 ring-primary"
            )}
          >
            <RadioGroupItem
              value={type.id}
              className="sr-only"
            />
            <Card className="p-4 hover:bg-accent transition-colors">
              <div className="flex flex-col items-center text-center gap-2">
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
            </Card>
          </Label>
        ))}
      </RadioGroup>
    </div>
  );
}

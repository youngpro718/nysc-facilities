
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
  };

  return (
    <Card className="p-6 animate-fade-in">
      <h2 className="text-lg font-semibold mb-4">What type of issue are you reporting?</h2>
      <RadioGroup
        value={selectedIssueType || ""}
        onValueChange={handleTypeSelect}
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
              <Card className="p-4 hover:bg-accent transition-colors h-full">
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
          </div>
        ))}
      </RadioGroup>
    </Card>
  );
}

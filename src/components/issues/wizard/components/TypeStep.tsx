
import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ISSUE_TYPES } from '../constants/issueTypes';
import { StandardizedIssueType } from '../../constants/issueTypes';
import { WizardStepProps } from '../types/index';

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
        className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      >
        {ISSUE_TYPES.map((type) => (
          <div key={type.id} className="relative group">
            <RadioGroupItem
              value={type.id}
              id={`type-${type.id}`}
              className="absolute opacity-0 w-full h-full cursor-pointer inset-0 z-10"
            />
            <Label
              htmlFor={`type-${type.id}`}
              className={cn(
                "cursor-pointer block h-full min-h-[100px] sm:min-h-[120px]",
                "transition-all duration-200 ease-in-out",
                selectedIssueType === type.id && "ring-2 ring-primary ring-offset-2"
              )}
            >
              <div className={cn(
                "p-4 sm:p-5 h-full border-2 rounded-xl transition-all duration-200",
                "flex flex-col items-center text-center gap-3",
                "hover:border-primary/30 hover:bg-primary/5 hover:scale-[1.02]",
                "group-hover:shadow-md",
                selectedIssueType === type.id 
                  ? "border-primary bg-primary/10 shadow-md scale-[1.02]" 
                  : "border-border bg-background/50"
              )}>
                <div className={cn(
                  "rounded-full p-3 transition-all duration-200",
                  "flex items-center justify-center",
                  selectedIssueType === type.id 
                    ? "bg-primary/20 scale-110" 
                    : "bg-muted/50 group-hover:bg-primary/10 group-hover:scale-105",
                  type.color
                )}>
                  <div className="w-6 h-6 sm:w-7 sm:h-7">
                    {type.icon}
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className={cn(
                    "font-semibold text-sm sm:text-base transition-colors",
                    selectedIssueType === type.id && "text-primary"
                  )}>
                    {type.label}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                    {type.description}
                  </p>
                </div>
                {/* Selection indicator */}
                {selectedIssueType === type.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center animate-scale-in">
                    <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                  </div>
                )}
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
      
      {/* Mobile hint */}
      <div className="sm:hidden text-center">
        <p className="text-xs text-muted-foreground">
          Tap a category to select it
        </p>
      </div>
    </div>
  );
}

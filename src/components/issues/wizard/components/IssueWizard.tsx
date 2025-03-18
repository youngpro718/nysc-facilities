
import React from 'react';
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormData } from "../../types/formTypes";
import { StandardizedIssueType } from "../../constants/issueTypes";
import { IssueWizardProps } from "../types";
import { WizardProvider, useWizardContext, useWizardNavigation } from "../hooks/useWizardContext";
import { TypeStep } from "./TypeStep";
import { LocationStep } from "./LocationStep";
import { DetailsStep } from "./DetailsStep";
import { ReviewStep } from "./ReviewStep";

function IssueWizardContent({ onSuccess, onCancel }: IssueWizardProps) {
  const {
    selectedIssueType,
    selectedPhotos,
    isEmergency,
  } = useWizardContext();
  
  const {
    currentStep,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
  } = useWizardNavigation();

  const queryClient = useQueryClient();
  const form = useForm<FormData>();

  const createIssueMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      const formattedDueDate = data.due_date ? new Date(data.due_date).toISOString() : null;
      
      const { error } = await supabase
        .from('issues')
        .insert({
          title: data.title || `${data.issue_type} Issue ${data.problem_type ? `- ${data.problem_type}` : ''} - ${data.priority.toUpperCase()} Priority`,
          description: data.description,
          type: data.issue_type as StandardizedIssueType,
          priority: isEmergency ? 'high' : data.priority,
          status: 'open',
          building_id: data.building_id,
          floor_id: data.floor_id,
          room_id: data.room_id,
          photos: selectedPhotos,
          seen: false,
          due_date: formattedDueDate,
          date_info: data.date_info || null,
          created_by: user.id
        });
      
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['userIssues'] });
      await queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onSuccess: () => {
      toast.success("Issue reported successfully");
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Error creating issue:', error);
      toast.error(error.message || "Failed to report issue");
    }
  });

  const handleNext = async () => {
    const isValid = await form.trigger(getFieldsForStep(currentStep));
    if (isValid) {
      // If we're on the location step, make sure room_id is selected
      if (currentStep === 'location' && !form.getValues('room_id')) {
        toast.error("Room selection is required");
        return;
      }
      goForward();
    }
  };

  const getFieldsForStep = (step: typeof currentStep): (keyof FormData)[] => {
    switch (step) {
      case 'type':
        return ['issue_type'];
      case 'location':
        return ['building_id', 'floor_id', 'room_id'];
      case 'details':
        return ['description', 'problem_type'];
      case 'review':
        return [];
      default:
        return [];
    }
  };

  const onSubmit = (data: FormData) => {
    createIssueMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="min-h-[400px]">
          {currentStep === 'type' && (
            <TypeStep
              form={form}
              onNext={handleNext}
              onBack={goBack}
            />
          )}
          {currentStep === 'location' && (
            <LocationStep
              form={form}
              onNext={handleNext}
              onBack={goBack}
            />
          )}
          {currentStep === 'details' && (
            <DetailsStep
              form={form}
              onNext={handleNext}
              onBack={goBack}
            />
          )}
          {currentStep === 'review' && (
            <ReviewStep
              form={form}
              onNext={handleNext}
              onBack={goBack}
              isLoading={createIssueMutation.isPending}
            />
          )}
        </div>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            {canGoBack && (
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
              >
                Back
              </Button>
            )}
            {canGoForward ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!selectedIssueType || (currentStep === 'location' && !form.getValues('room_id'))}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={createIssueMutation.isPending}
              >
                Submit Issue
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}

export function IssueWizard(props: IssueWizardProps) {
  return (
    <WizardProvider assignedRooms={props.assignedRooms}>
      <IssueWizardContent {...props} />
    </WizardProvider>
  );
}

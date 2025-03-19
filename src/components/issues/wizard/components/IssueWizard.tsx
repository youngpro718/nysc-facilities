
import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormData } from "../../types/formTypes";
import { StandardizedIssueType } from "../../constants/issueTypes";
import { IssueWizardProps } from "../types";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { TypeStep } from "./TypeStep";
import { LocationStep } from "./LocationStep";
import { DetailsStep } from "./DetailsStep";

export function IssueWizard({ onSuccess, onCancel, assignedRooms }: IssueWizardProps) {
  const [currentStep, setCurrentStep] = useState<'type' | 'location' | 'details'>('type');
  const [selectedIssueType, setSelectedIssueType] = useState<StandardizedIssueType | null>(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const queryClient = useQueryClient();
  const form = useForm<FormData>({
    defaultValues: {
      priority: 'medium',
      description: '',
    }
  });

  // Handle photo upload
  const handlePhotoUpload = async (files: FileList) => {
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `issue-photos/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('issue-photos')
          .upload(filePath, file);
          
        if (uploadError) {
          console.error('Error uploading photo:', uploadError);
          continue;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('issue-photos')
          .getPublicUrl(filePath);
          
        uploadedUrls.push(publicUrl);
      }
      
      setSelectedPhotos(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Error in handlePhotoUpload:', error);
    } finally {
      setUploading(false);
    }
  };

  const createIssueMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      const formattedDueDate = data.due_date ? new Date(data.due_date).toISOString() : null;
      
      const { error } = await supabase
        .from('issues')
        .insert({
          title: data.title || `${data.issue_type} Issue ${data.problem_type ? `- ${data.problem_type}` : ''} - ${isEmergency ? 'HIGH' : data.priority.toUpperCase()} Priority`,
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
      setSelectedIssueType(null);
      setCurrentStep('type');
      setSelectedPhotos([]);
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Error creating issue:', error);
      toast.error(error.message || "Failed to report issue");
    }
  });

  const handleNext = async () => {
    const isValid = await form.trigger(getFieldsForStep(currentStep));
    if (!isValid) return;
    
    if (currentStep === 'type') {
      if (!selectedIssueType) {
        toast.error("Please select an issue type");
        return;
      }
      setCurrentStep('location');
    } else if (currentStep === 'location') {
      if (!form.getValues('room_id')) {
        toast.error("Room selection is required");
        return;
      }
      setCurrentStep('details');
    } else {
      // Submit the form
      form.handleSubmit(onSubmit)();
    }
  };

  const handleBack = () => {
    if (currentStep === 'location') {
      setCurrentStep('type');
    } else if (currentStep === 'details') {
      setCurrentStep('location');
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
      default:
        return [];
    }
  };

  const onSubmit = (data: FormData) => {
    createIssueMutation.mutate(data);
  };

  const wizardContext = {
    selectedIssueType,
    setSelectedIssueType,
    isEmergency,
    setIsEmergency,
    selectedPhotos,
    setSelectedPhotos,
    uploading,
    handlePhotoUpload,
    assignedRooms
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {isEmergency && (
          <Alert variant="destructive" className="animate-fade-in">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This issue has been marked as emergency. It will be prioritized.
            </AlertDescription>
          </Alert>
        )}

        <div className="min-h-[400px]">
          {currentStep === 'type' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">What type of issue are you reporting?</h2>
              <TypeStep 
                form={form} 
                onNext={handleNext} 
                onBack={onCancel}
                selectedIssueType={selectedIssueType}
                setSelectedIssueType={setSelectedIssueType}
              />
            </Card>
          )}
          
          {currentStep === 'location' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Where is the issue located?</h2>
              <LocationStep 
                form={form} 
                onNext={handleNext} 
                onBack={handleBack}
                assignedRooms={assignedRooms}
              />
            </Card>
          )}
          
          {currentStep === 'details' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Describe the issue</h2>
              <DetailsStep 
                form={form} 
                onNext={handleNext} 
                onBack={handleBack}
                isEmergency={isEmergency}
                setIsEmergency={setIsEmergency}
                selectedPhotos={selectedPhotos}
                setSelectedPhotos={setSelectedPhotos}
                uploading={uploading}
                handlePhotoUpload={handlePhotoUpload}
              />
            </Card>
          )}
        </div>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 'type' ? onCancel : handleBack}
          >
            {currentStep === 'type' ? 'Cancel' : 'Back'}
          </Button>

          <Button
            type="button"
            onClick={handleNext}
            disabled={createIssueMutation.isPending || (currentStep === 'type' && !selectedIssueType)}
          >
            {currentStep === 'details' ? (
              createIssueMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : 'Submit Issue'
            ) : 'Next'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

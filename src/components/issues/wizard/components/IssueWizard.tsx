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
import { AlertTriangle, Loader2, Check, ArrowLeft, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TypeStep } from "./TypeStep";
import { LocationStep } from "./LocationStep";
import { DetailsStep } from "./DetailsStep";
import { cn } from "@/lib/utils";

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

  // Get current step info for progress
  const steps = [
    { key: 'type', label: 'Issue Type', description: 'Select category' },
    { key: 'location', label: 'Location', description: 'Where is it?' },
    { key: 'details', label: 'Details', description: 'Describe the issue' }
  ];
  
  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Progress Header */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Report an Issue</h1>
                <p className="text-sm text-muted-foreground">
                  Step {currentStepIndex + 1} of {steps.length}: {steps[currentStepIndex]?.description}
                </p>
              </div>
              {isEmergency && (
                <Badge variant="destructive" className="w-fit">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Emergency
                </Badge>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-3">
              <Progress value={progressPercentage} className="h-2" />
              <div className="hidden sm:flex justify-between text-xs">
                {steps.map((step, index) => (
                  <div 
                    key={step.key}
                    className={cn(
                      "flex items-center gap-1.5 transition-colors",
                      index <= currentStepIndex 
                        ? "text-primary font-medium" 
                        : "text-muted-foreground"
                    )}
                  >
                    {index < currentStepIndex ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <div className={cn(
                        "w-3 h-3 rounded-full border-2",
                        index === currentStepIndex 
                          ? "border-primary bg-primary" 
                          : "border-muted-foreground"
                      )} />
                    )}
                    <span className="hidden md:inline">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Emergency Alert */}
          {isEmergency && (
            <Alert variant="destructive" className="animate-fade-in">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This issue has been marked as emergency. It will be prioritized for immediate attention.
              </AlertDescription>
            </Alert>
          )}

          {/* Step Content */}
          <div className="min-h-[400px] sm:min-h-[450px]">
            {currentStep === 'type' && (
              <Card className="border-0 shadow-sm">
                <div className="p-4 sm:p-6">
                  <div className="mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold mb-2">
                      What type of issue are you reporting?
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Select the category that best describes your issue
                    </p>
                  </div>
                  <TypeStep 
                    form={form} 
                    onNext={handleNext} 
                    onBack={onCancel}
                    selectedIssueType={selectedIssueType}
                    setSelectedIssueType={setSelectedIssueType}
                  />
                </div>
              </Card>
            )}
            
            {currentStep === 'location' && (
              <Card className="border-0 shadow-sm">
                <div className="p-4 sm:p-6">
                  <div className="mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold mb-2">
                      Where is the issue located?
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Help us locate the problem so we can address it quickly
                    </p>
                  </div>
                  <LocationStep 
                    form={form} 
                    onNext={handleNext} 
                    onBack={handleBack}
                    assignedRooms={assignedRooms}
                  />
                </div>
              </Card>
            )}
            
            {currentStep === 'details' && (
              <Card className="border-0 shadow-sm">
                <div className="p-4 sm:p-6">
                  <div className="mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold mb-2">
                      Provide additional details
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      The more details you provide, the faster we can resolve the issue
                    </p>
                  </div>
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
                </div>
              </Card>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 'type' ? onCancel : handleBack}
              className="w-full sm:w-auto"
              disabled={createIssueMutation.isPending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 'type' ? 'Cancel' : 'Back'}
            </Button>

            <Button
              type="button"
              onClick={handleNext}
              disabled={createIssueMutation.isPending || (currentStep === 'type' && !selectedIssueType)}
              className="w-full sm:w-auto"
            >
              {currentStep === 'details' ? (
                createIssueMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Issue
                    <Check className="w-4 h-4 ml-2" />
                  </>
                )
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
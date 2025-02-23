
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { FormData } from "../types/formTypes";
import { StandardizedIssueType } from "../constants/issueTypes";
import { UserAssignment } from "@/types/dashboard";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ChevronLeft, ChevronRight, Flag, AlertOctagon, Mic, Camera } from "lucide-react";
import { LocationFields } from "../form-sections/LocationFields";
import { IssueTypeField } from "../form-sections/IssueTypeField";
import { ProblemTypeField } from "../form-sections/ProblemTypeField";
import { DescriptionField } from "../form-sections/DescriptionField";
import { IssuePhotoForm } from "./IssuePhotoForm";
import { usePhotoUpload } from "../hooks/usePhotoUpload";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Form } from "@/components/ui/form";

interface IssueWizardProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  assignedRooms?: UserAssignment[];
}

type WizardStep = 'location' | 'type' | 'details' | 'review';

export function IssueWizard({ onSuccess, onCancel, assignedRooms }: IssueWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('location');
  const [isEmergency, setIsEmergency] = useState(false);
  const { uploading, selectedPhotos, handlePhotoUpload, setSelectedPhotos } = usePhotoUpload();
  const queryClient = useQueryClient();
  const [selectedIssueType, setSelectedIssueType] = useState<StandardizedIssueType | null>(null);
  
  // Find primary assigned room
  const primaryRoom = assignedRooms?.find(room => room.is_primary);

  const form = useForm<FormData>({
    defaultValues: {
      priority: 'medium',
      description: '',
      due_date: undefined,
      date_info: '',
      ...(primaryRoom && {
        building_id: primaryRoom.building_id,
        floor_id: primaryRoom.floor_id,
        room_id: primaryRoom.room_id
      })
    }
  });

  // Watch for critical issue types
  const watchIssueType = form.watch('issue_type');
  useEffect(() => {
    if (watchIssueType && watchIssueType !== selectedIssueType) {
      setSelectedIssueType(watchIssueType);
      const isCritical = watchIssueType === 'BUILDING_SYSTEMS' || watchIssueType === 'ELECTRICAL_NEEDS';
      setIsEmergency(isCritical);
      if (isCritical) {
        form.setValue('priority', 'high');
      }
    }
  }, [watchIssueType, selectedIssueType, form]);

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
          priority: data.priority,
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

  const onSubmit = (data: FormData) => {
    createIssueMutation.mutate(data);
  };

  const handleNext = async () => {
    const steps: WizardStep[] = ['location', 'type', 'details', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex < steps.length - 1) {
      const isValid = await form.trigger(getFieldsForStep(currentStep));
      if (isValid) {
        setCurrentStep(steps[currentIndex + 1]);
      }
    }
  };

  const handleBack = () => {
    const steps: WizardStep[] = ['location', 'type', 'details', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const getFieldsForStep = (step: WizardStep): (keyof FormData)[] => {
    switch (step) {
      case 'location':
        return ['building_id', 'floor_id', 'room_id'];
      case 'type':
        return ['issue_type', 'problem_type'];
      case 'details':
        return ['description'];
      case 'review':
        return [];
      default:
        return [];
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {isEmergency && (
          <Alert variant="destructive" className="mb-4">
            <AlertOctagon className="h-4 w-4" />
            <AlertDescription>
              This appears to be a critical issue. It will be marked as high priority.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {currentStep === 'location' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Where is the issue located?</h3>
              <LocationFields form={form} disableFields={!!primaryRoom} />
            </Card>
          )}

          {currentStep === 'type' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">What type of issue are you reporting?</h3>
              <div className="space-y-6">
                <IssueTypeField form={form} />
                <ProblemTypeField form={form} />
              </div>
            </Card>
          )}

          {currentStep === 'details' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Describe the issue</h3>
              <div className="space-y-6">
                <DescriptionField form={form} />
                <IssuePhotoForm
                  selectedPhotos={selectedPhotos}
                  uploading={uploading}
                  onPhotoUpload={handlePhotoUpload}
                  onPhotoRemove={(index) => {
                    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
                  }}
                />
              </div>
            </Card>
          )}

          {currentStep === 'review' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Review and Submit</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Location</h4>
                  <p className="text-muted-foreground">
                    {primaryRoom?.building_name}, {primaryRoom?.floor_name}, Room {primaryRoom?.room_number}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Issue Type</h4>
                  <p className="text-muted-foreground">
                    {form.getValues('issue_type')} {form.getValues('problem_type') && `- ${form.getValues('problem_type')}`}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Description</h4>
                  <p className="text-muted-foreground">{form.getValues('description')}</p>
                </div>
                {selectedPhotos.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Photos</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedPhotos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Issue photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="flex justify-between pt-6 border-t">
          <div>
            {currentStep !== 'location' && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            {currentStep !== 'review' ? (
              <Button
                type="button"
                onClick={handleNext}
                className={cn(
                  "flex items-center gap-2",
                  isEmergency && "bg-red-600 hover:bg-red-700"
                )}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={uploading || createIssueMutation.isPending}
                className={cn(
                  "flex items-center gap-2",
                  isEmergency && "bg-red-600 hover:bg-red-700"
                )}
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

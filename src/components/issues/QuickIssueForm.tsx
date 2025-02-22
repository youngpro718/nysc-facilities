
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { IssuePhotoForm } from "./wizard/IssuePhotoForm";
import { usePhotoUpload } from "./hooks/usePhotoUpload";
import { FormData } from "./types/formTypes";
import { StandardizedIssueType } from "./constants/issueTypes";
import { IssueTypeField } from "./form-sections/IssueTypeField";
import { ProblemTypeField } from "./form-sections/ProblemTypeField";
import { DescriptionField } from "./form-sections/DescriptionField";
import { LocationFields } from "./form-sections/LocationFields";

export function QuickIssueForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isManualTitle, setIsManualTitle] = useState(false);
  const [selectedIssueType, setSelectedIssueType] = useState<StandardizedIssueType | null>(null);
  const { uploading, selectedPhotos, handlePhotoUpload, setSelectedPhotos } = usePhotoUpload();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    defaultValues: {
      priority: 'medium',
      description: '',
      due_date: undefined,
      date_info: ''
    }
  });

  const createIssueMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formattedDueDate = data.due_date ? new Date(data.due_date).toISOString() : null;
      
      const { error } = await supabase
        .from('issues')
        .insert({
          title: data.title,
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
          date_info: data.date_info || null
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success("Issue reported successfully");
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to report issue");
    }
  });

  const generateTitle = (data: Partial<FormData>) => {
    if (!data.issue_type) return '';
    const parts = [
      data.issue_type,
      'Issue',
      data.problem_type ? `- ${data.problem_type}` : '',
      data.priority ? `- ${data.priority.toUpperCase()} Priority` : ''
    ];
    return parts.filter(Boolean).join(' ');
  };

  const onSubmit = async (data: FormData) => {
    if (!isManualTitle) {
      data.title = generateTitle(data);
    }
    createIssueMutation.mutate(data);
  };

  const handlePhotoRemove = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const watchIssueType = form.watch('issue_type');
  if (watchIssueType && watchIssueType !== selectedIssueType) {
    setSelectedIssueType(watchIssueType);
    // Set high priority for critical systems
    if (watchIssueType === 'BUILDING_SYSTEMS' || watchIssueType === 'ELECTRICAL_NEEDS') {
      form.setValue('priority', 'high');
    }
  }

  const handleCancel = () => {
    const hasData = Object.values(form.getValues()).some(value => 
      value !== '' && value !== undefined && value !== 'medium'
    );

    if (hasData) {
      if (window.confirm('Are you sure you want to cancel? All entered data will be lost.')) {
        form.reset();
        onSuccess?.();
      }
    } else {
      onSuccess?.();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <IssueTypeField form={form} />
        <ProblemTypeField form={form} />

        <div className="flex items-center space-x-2">
          <Switch
            checked={isManualTitle}
            onCheckedChange={setIsManualTitle}
            id="manual-title"
          />
          <FormLabel htmlFor="manual-title" className="cursor-pointer">
            Edit title manually
          </FormLabel>
        </div>

        {isManualTitle && (
          <div className="form-group">
            <FormLabel>Title</FormLabel>
            <Input {...form.register('title')} placeholder="Issue title" />
          </div>
        )}

        <DescriptionField form={form} />
        <LocationFields form={form} />

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="due_date"
            render={({ field: { value, onChange, ...fieldProps } }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local"
                    {...fieldProps}
                    value={value || ''}
                    onChange={(e) => {
                      console.log('Date changed:', e.target.value);
                      onChange(e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date_info"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date Information</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Why is this date being set? (e.g., scheduled painting, repairs)" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <IssuePhotoForm
            selectedPhotos={selectedPhotos}
            uploading={uploading}
            onPhotoUpload={handlePhotoUpload}
            onPhotoRemove={handlePhotoRemove}
          />
          
          {selectedIssueType && !selectedPhotos.length && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Adding photos helps maintenance staff better understand and resolve the issue.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex space-x-4">
          <Button 
            type="button" 
            variant="destructive"
            onClick={handleCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={uploading || createIssueMutation.isPending}
            className="flex-1"
          >
            Submit Issue
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default QuickIssueForm;

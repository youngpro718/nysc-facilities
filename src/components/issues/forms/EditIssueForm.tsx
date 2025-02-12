
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Issue } from "../types/IssueTypes";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { BasicIssueFields } from "../form-sections/BasicIssueFields";
import { StatusAndPriorityFields } from "../form-sections/StatusAndPriorityFields";
import { AssigneeField } from "../form-sections/AssigneeField";
import { ResolutionFields } from "../form-sections/ResolutionFields";
import { FormData } from "../types/formTypes";
import { usePhotoUpload } from "../hooks/usePhotoUpload";
import { IssuePhotoForm } from "../wizard/IssuePhotoForm";

const editIssueSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["open", "in_progress", "resolved"] as const),
  priority: z.enum(["low", "medium", "high"] as const),
  due_date: z.string().optional().nullable(),
  date_info: z.string().optional().nullable(),
  resolution_type: z.enum(["fixed", "replaced", "maintenance_performed", "no_action_needed", "deferred", "other"] as const).optional(),
  resolution_notes: z.string().optional(),
  assignee_id: z.string().optional(),
});

interface EditIssueFormProps {
  issue: Issue;
  onClose: () => void;
}

export function EditIssueForm({ issue, onClose }: EditIssueFormProps) {
  const queryClient = useQueryClient();
  const { uploading, selectedPhotos, handlePhotoUpload, setSelectedPhotos } = usePhotoUpload();

  // Format the initial due date properly
  const formatInitialDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(editIssueSchema),
    defaultValues: {
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      due_date: formatInitialDate(issue.due_date),
      date_info: issue.date_info || '',
      resolution_type: issue.resolution_type || undefined,
      resolution_notes: issue.resolution_notes || '',
      assignee_id: issue.assignee_id || undefined,
    },
  });

  const watchStatus = form.watch("status");
  const isResolved = watchStatus === "resolved";

  const updateIssueMutation = useMutation({
    mutationFn: async (values: FormData) => {
      // Handle empty date string
      const formattedDueDate = values.due_date && values.due_date.trim() !== '' 
        ? new Date(values.due_date).toISOString()
        : null;

      const updateData = {
        ...values,
        due_date: formattedDueDate,
        photos: selectedPhotos,
        resolution_date: isResolved ? new Date().toISOString() : null,
      };

      console.log('Submitting with due date:', formattedDueDate);

      const { error } = await supabase
        .from('issues')
        .update(updateData)
        .eq('id', issue.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', issue.id] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success("Issue updated successfully");
      onClose();
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error("Failed to update issue");
    },
  });

  const onSubmit = (values: FormData) => {
    if (isResolved && !values.resolution_type) {
      form.setError("resolution_type", {
        type: "manual",
        message: "Resolution type is required when marking as resolved",
      });
      return;
    }
    updateIssueMutation.mutate(values);
  };

  const handlePhotoRemove = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6">
          <BasicIssueFields form={form} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AssigneeField form={form} />
            <StatusAndPriorityFields form={form} />
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local" 
                      {...field}
                      onChange={(e) => {
                        console.log('New date value:', e.target.value);
                        field.onChange(e);
                      }}
                      value={field.value || ''}
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
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {isResolved && <ResolutionFields form={form} />}

          <IssuePhotoForm
            selectedPhotos={selectedPhotos}
            uploading={uploading}
            onPhotoUpload={handlePhotoUpload}
            onPhotoRemove={handlePhotoRemove}
          />
        </div>

        <div className="flex justify-end gap-2 sticky bottom-0 py-4 bg-background border-t mt-6">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={updateIssueMutation.isPending}
          >
            {updateIssueMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Issue'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

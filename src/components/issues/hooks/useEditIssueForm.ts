
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Issue } from "../types/IssueTypes";
import { FormData } from "../types/formTypes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const editIssueSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["open", "in_progress", "resolved"] as const),
  priority: z.enum(["low", "medium", "high"] as const),
  due_date: z.string().optional().nullable(),
  date_info: z.string().optional().nullable(),
  resolution_type: z.enum(["fixed", "replaced", "maintenance_performed", "no_action_needed", "deferred", "other"] as const).optional(),
  resolution_notes: z.string().optional(),
  assigned_to: z.enum(["DCAS", "OCA", "Self", "Outside_Vendor"] as const).optional(),
  impact_level: z.string().optional(),
  tags: z.array(z.string()).optional(),
  recurring_pattern: z.object({
    is_recurring: z.boolean().default(false),
    frequency: z.string().optional(),
    pattern_confidence: z.number().optional(),
  }).optional(),
  maintenance_requirements: z.object({
    scheduled: z.boolean().default(false),
    frequency: z.string().optional(),
    next_due: z.string().optional(),
  }).optional(),
  lighting_details: z.object({
    fixture_status: z.string().optional(),
    detected_issues: z.array(z.string()).optional(),
    maintenance_history: z.array(z.any()).optional(),
  }).optional(),
});

export const useEditIssueForm = (issue: Issue, onClose: () => void) => {
  const queryClient = useQueryClient();

  const formatInitialDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      return format(parseISO(dateString), "yyyy-MM-dd'T'HH:mm");
    } catch (error) {
      console.error('Date parsing error:', error);
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
      assigned_to: issue.assigned_to || undefined,
      impact_level: issue.impact_level || undefined,
      tags: issue.tags || [],
      recurring_pattern: issue.recurring_pattern || {
        is_recurring: false,
      },
      maintenance_requirements: issue.maintenance_requirements || {
        scheduled: false,
      },
      lighting_details: issue.lighting_details,
    },
  });

  const watchStatus = form.watch("status");
  const isResolved = watchStatus === "resolved";

  const updateIssueMutation = useMutation({
    mutationFn: async (values: FormData) => {
      let formattedDueDate = null;
      
      if (values.due_date && values.due_date.trim() !== '') {
        try {
          formattedDueDate = new Date(values.due_date).toISOString();
        } catch (error) {
          console.error('Date formatting error:', error);
          throw new Error('Invalid date format');
        }
      }

      const updateData = {
        ...values,
        due_date: formattedDueDate,
        resolution_date: isResolved ? new Date().toISOString() : null,
      };

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

  return {
    form,
    isResolved,
    updateIssueMutation,
    onSubmit,
  };
};

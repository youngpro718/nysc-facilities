
import { zodResolver } from "@hookform/resolvers/zod";
import { logger } from '@/lib/logger';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Issue } from "../types/IssueTypes";
import { FormData } from "../types/formTypes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

// Every field here must be a real column on `issues` — this form used to
// also collect impact_level, assigned_to, recurring_pattern,
// maintenance_requirements, and lighting_details, none of which exist on
// the table, so saving an edit always failed with a "column not found"
// error from Postgres regardless of what was actually changed.
const editIssueSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["open", "in_progress", "resolved"] as const),
  priority: z.enum(["low", "medium", "high", "critical"] as const),
  due_date: z.string().optional().nullable(),
  date_info: z.string().optional().nullable(),
  resolution_type: z.enum(["fixed", "replaced", "maintenance_performed", "no_action_needed", "deferred", "other"] as const).optional(),
  resolution_notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const useEditIssueForm = (issue: Issue, onClose: () => void) => {
  const queryClient = useQueryClient();

  const formatInitialDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      return format(parseISO(dateString), "yyyy-MM-dd'T'HH:mm");
    } catch (error) {
      logger.error('Date parsing error:', error);
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
      tags: issue.tags || [],
    },
  });

  const watchStatus = form.watch("status");
  const isResolved = watchStatus === "resolved";

  const updateIssueMutation = useMutation({
    mutationFn: async ({ values, photos }: { values: FormData; photos: string[] }) => {
      let formattedDueDate = null;

      if (values.due_date && values.due_date.trim() !== '') {
        try {
          formattedDueDate = new Date(values.due_date).toISOString();
        } catch (error) {
          logger.error('Date formatting error:', error);
          throw new Error('Invalid date format');
        }
      }

      const updateData = {
        ...values,
        due_date: formattedDueDate,
        resolved_at: isResolved ? new Date().toISOString() : null,
        photos,
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
      logger.error('Update error:', error);
      toast.error("Failed to update issue");
    },
  });

  const onSubmit = (values: FormData, photos: string[]) => {
    if (isResolved && !values.resolution_type) {
      form.setError("resolution_type", {
        type: "manual",
        message: "Resolution type is required when marking as resolved",
      });
      return;
    }
    updateIssueMutation.mutate({ values, photos });
  };

  return {
    form,
    isResolved,
    updateIssueMutation,
    onSubmit,
  };
};

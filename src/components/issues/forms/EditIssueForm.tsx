import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Issue, IssueStatus, IssuePriority, ResolutionType } from "../types/IssueTypes";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const editIssueSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["open", "in_progress", "resolved"] as const),
  priority: z.enum(["low", "medium", "high"] as const),
  due_date: z.string().optional(),
  resolution_type: z.enum(["fixed", "replaced", "maintenance_performed", "no_action_needed", "deferred", "other"] as const).optional(),
  resolution_notes: z.string().optional(),
  assignee_id: z.string().optional(),
});

type EditIssueFormValues = z.infer<typeof editIssueSchema>;

interface EditIssueFormProps {
  issue: Issue;
  onClose: () => void;
}

export function EditIssueForm({ issue, onClose }: EditIssueFormProps) {
  const queryClient = useQueryClient();

  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name');
      
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<EditIssueFormValues>({
    resolver: zodResolver(editIssueSchema),
    defaultValues: {
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      due_date: issue.due_date,
      resolution_type: issue.resolution_type,
      resolution_notes: issue.resolution_notes,
      assignee_id: issue.assignee_id,
    },
  });

  const watchStatus = form.watch("status");
  const isResolved = watchStatus === "resolved";

  const updateIssueMutation = useMutation({
    mutationFn: async (values: EditIssueFormValues) => {
      const updateData = {
        ...values,
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
    onError: () => {
      toast.error("Failed to update issue");
    },
  });

  const onSubmit = (values: EditIssueFormValues) => {
    if (isResolved && !values.resolution_type) {
      form.setError("resolution_type", {
        type: "manual",
        message: "Resolution type is required when marking as resolved",
      });
      return;
    }
    updateIssueMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} className="min-h-[100px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="assignee_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assignee</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {profiles?.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.first_name} {profile.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="due_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due Date</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isResolved && (
          <>
            <FormField
              control={form.control}
              name="resolution_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resolution Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select resolution type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="replaced">Replaced</SelectItem>
                      <SelectItem value="maintenance_performed">Maintenance Performed</SelectItem>
                      <SelectItem value="no_action_needed">No Action Needed</SelectItem>
                      <SelectItem value="deferred">Deferred</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resolution_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resolution Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Provide details about the resolution..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <div className="flex justify-end gap-2">
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

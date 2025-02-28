
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResolutionType } from "../types/IssueTypes";
import { useResolveIssueMutation } from "../hooks/mutations/useResolveIssueMutation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface ResolutionFormProps {
  issueId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Create a schema for form validation
const resolutionSchema = z.object({
  resolution_type: z.string({
    required_error: "Please select a resolution type",
  }),
  resolution_notes: z.string().min(1, "Resolution notes are required"),
});

type ResolutionFormData = z.infer<typeof resolutionSchema>;

const RESOLUTION_TYPES: { label: string; value: ResolutionType }[] = [
  { label: "Fixed", value: "fixed" },
  { label: "Replaced", value: "replaced" },
  { label: "Maintenance Performed", value: "maintenance_performed" },
  { label: "No Action Needed", value: "no_action_needed" },
  { label: "Deferred", value: "deferred" },
  { label: "Other", value: "other" },
];

export function ResolutionForm({ issueId, onSuccess, onCancel }: ResolutionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ResolutionFormData>({
    resolver: zodResolver(resolutionSchema),
    defaultValues: {
      resolution_notes: "",
    },
  });

  const resolveMutation = useResolveIssueMutation();

  const onSubmit = async (data: ResolutionFormData) => {
    if (!issueId) {
      toast.error("Issue ID is missing");
      return;
    }
    
    // Prevent duplicate submissions
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      console.log("Submitting resolution form:", { issueId, ...data });
      
      await resolveMutation.mutateAsync({
        id: issueId,
        resolution_type: data.resolution_type as ResolutionType,
        resolution_notes: data.resolution_notes,
      });

      // Reset form on success
      form.reset();
      
      // Allow a short delay for the UI to update before closing the dialog
      setTimeout(() => {
        if (onSuccess) {
          console.log("Calling onSuccess callback");
          onSuccess();
        }
        setIsSubmitting(false);
      }, 250);
    } catch (error) {
      console.error("Resolution submission error:", error);
      toast.error("Failed to resolve issue");
      setIsSubmitting(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Don't allow cancellation during active submission
    if (isSubmitting) return;
    
    form.reset();
    if (onCancel) {
      onCancel();
    }
  };

  // Determine if we should disable controls
  const isProcessing = isSubmitting || resolveMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <FormField
          control={form.control}
          name="resolution_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resolution Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={isProcessing}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select how the issue was resolved" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {RESOLUTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
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
          name="resolution_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resolution Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe how the issue was resolved"
                  className="min-h-[100px]"
                  disabled={isProcessing}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isProcessing}
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resolving...
              </>
            ) : (
              'Resolve Issue'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

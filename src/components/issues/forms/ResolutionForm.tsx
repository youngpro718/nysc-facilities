
import React from "react";
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

interface ResolutionFormProps {
  issueId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ResolutionFormData {
  resolution_type: ResolutionType;
  resolution_notes: string;
}

const RESOLUTION_TYPES: { label: string; value: ResolutionType }[] = [
  { label: "Fixed", value: "fixed" },
  { label: "Replaced", value: "replaced" },
  { label: "Maintenance Performed", value: "maintenance_performed" },
  { label: "No Action Needed", value: "no_action_needed" },
  { label: "Deferred", value: "deferred" },
  { label: "Other", value: "other" },
];

export function ResolutionForm({ issueId, onSuccess, onCancel }: ResolutionFormProps) {
  const form = useForm<ResolutionFormData>({
    defaultValues: {
      resolution_notes: "",
    },
  });

  const resolveMutation = useResolveIssueMutation();

  const onSubmit = async (data: ResolutionFormData) => {
    resolveMutation.mutate(
      { 
        id: issueId, 
        resolution_type: data.resolution_type, 
        resolution_notes: data.resolution_notes 
      },
      {
        onSuccess: () => {
          onSuccess?.();
          toast.success("Issue resolved successfully");
        },
        onError: (error: Error) => {
          toast.error(error.message || "Failed to resolve issue");
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="resolution_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resolution Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              onClick={onCancel}
              disabled={resolveMutation.isPending}
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit"
            disabled={resolveMutation.isPending}
          >
            {resolveMutation.isPending ? (
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

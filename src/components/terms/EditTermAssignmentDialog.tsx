import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const assignmentSchema = z.object({
  termId: z.string({
    required_error: "Please select a term.",
  }),
  personnelId: z.string({
    required_error: "Please select personnel.",
  }),
  assignmentType: z.string({
    required_error: "Please select an assignment type.",
  }),
  notes: z.string().optional(),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

interface EditTermAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  termId?: string;
}

export function EditTermAssignmentDialog({
  open,
  onOpenChange,
  termId,
}: EditTermAssignmentDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: terms, isLoading: loadingTerms } = useQuery({
    queryKey: ["terms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("court_terms")
        .select("id, name")
        .order("name");

      if (error) {
        console.error("Error fetching terms:", error);
        throw error;
      }
      return data || [];
    },
  });

  const { data: personnel, isLoading: loadingPersonnel } = useQuery({
    queryKey: ["personnel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .order("last_name");

      if (error) {
        console.error("Error fetching personnel:", error);
        throw error;
      }
      return data || [];
    },
  });

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      termId: termId || "",
      personnelId: "",
      assignmentType: "",
      notes: "",
    },
  });

  const onSubmit = async (formData: AssignmentFormValues) => {
    setIsSubmitting(true);
    try {
      // Assuming this is where the type error is happening
      // We'll convert the string to an array with a single string element
      const selectedPersonnel = formData.personnelId ? [formData.personnelId] : [];

      const { data, error } = await supabase
        .from("term_assignments")
        .insert([
          {
            term_id: formData.termId,
            personnel_id: selectedPersonnel, // Use the array here
            assignment_type: formData.assignmentType,
            notes: formData.notes,
          },
        ])
        .select();

      if (error) {
        console.error("Error creating assignment:", error);
        toast.error(`Failed to create assignment: ${error.message}`);
      } else {
        toast.success("Assignment created successfully!");
        queryClient.invalidateQueries({ queryKey: ["term-assignments"] });
        form.reset();
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const assignmentTypes = [
    { value: "judge", label: "Judge" },
    { value: "clerk", label: "Clerk" },
    { value: "reporter", label: "Reporter" },
    { value: "security", label: "Security" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Term Assignment</DialogTitle>
          <DialogDescription>
            Assign personnel to specific court terms.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="termId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Term</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loadingTerms}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a term" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {terms?.map((term) => (
                        <SelectItem key={term.id} value={term.id}>
                          {term.name}
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
              name="personnelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personnel</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loadingPersonnel}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select personnel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {personnel?.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.first_name} {person.last_name}
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
              name="assignmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignment Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assignmentTypes.map((type) => (
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input placeholder="Additional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Create Assignment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

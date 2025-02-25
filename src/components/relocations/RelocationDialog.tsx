
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { RoomSelectionFields } from "./form-sections/RoomSelectionFields";
import { DateAndTypeFields } from "./form-sections/DateAndTypeFields";
import { ReasonFields } from "./form-sections/ReasonFields";
import { FormValues, relocationSchema } from "./types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

interface RelocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RelocationDialog({ open, onOpenChange }: RelocationDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(relocationSchema),
    defaultValues: {
      relocation_type: "maintenance"
    }
  });
  const queryClient = useQueryClient();

  const createRelocation = useMutation({
    mutationFn: async (values: FormValues) => {
      try {
        console.log("Starting relocation creation with values:", values);

        // Check user authentication first
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error("Authentication error:", authError);
          throw new Error("You must be logged in to create relocations");
        }

        // Validate dates first
        const startDate = new Date(values.start_date);
        const endDate = new Date(values.end_date);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.error("Invalid date format detected");
          throw new Error("Invalid date format");
        }
        
        if (endDate <= startDate) {
          console.error("End date is before or equal to start date");
          throw new Error("End date must be after start date");
        }

        // Prepare the relocation data
        const relocationData = {
          original_room_id: values.original_room_id,
          temporary_room_id: values.temporary_room_id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          reason: values.reason,
          relocation_type: values.relocation_type,
          status: 'scheduled' as const,
          notes: values.special_instructions || '',
          created_by: user.id
        };

        console.log("Submitting relocation data:", relocationData);

        const { data, error } = await supabase
          .from('room_relocations')
          .insert(relocationData)
          .select()
          .single();

        if (error) {
          console.error("Supabase insertion error:", error);
          throw new Error(error.message);
        }

        console.log("Successfully created relocation:", data);
        return data;
      } catch (error) {
        console.error("Error in createRelocation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Relocation created successfully");
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      toast.success('Relocation scheduled successfully');
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      console.error("Error creating relocation:", error);
      toast.error(error.message || 'Failed to schedule relocation');
    }
  });

  const onSubmit = async (values: FormValues) => {
    try {
      console.log("Form submitted with values:", values);
      
      // Check if required fields are filled
      if (!values.original_room_id || !values.temporary_room_id) {
        console.error("Missing room selection");
        toast.error("Please select both rooms");
        return;
      }

      if (!values.start_date || !values.end_date) {
        console.error("Missing dates");
        toast.error("Please select both start and end dates");
        return;
      }

      await createRelocation.mutateAsync(values);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schedule Room Relocation</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <RoomSelectionFields form={form} />
            <DateAndTypeFields form={form} />
            <ReasonFields form={form} />

            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createRelocation.isPending}
              >
                {createRelocation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Relocation"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


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

        // Validate dates first
        const startDate = new Date(values.start_date);
        const endDate = new Date(values.end_date);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error("Invalid date format");
        }
        
        if (endDate <= startDate) {
          throw new Error("End date must be after start date");
        }

        const user = await supabase.auth.getUser();
        if (!user.data.user?.id) {
          throw new Error("User not authenticated");
        }

        // Prepare the data
        const relocationData = {
          original_room_id: values.original_room_id,
          temporary_room_id: values.temporary_room_id,
          start_date: values.start_date,
          end_date: values.end_date,
          reason: values.reason,
          relocation_type: values.relocation_type,
          status: 'scheduled' as const,
          notes: values.special_instructions || '',
          created_by: user.data.user.id
        };

        console.log("Submitting relocation data to Supabase:", relocationData);

        const { data, error } = await supabase
          .from('room_relocations')
          .insert(relocationData)
          .select()
          .single();

        if (error) {
          console.error("Supabase error:", error);
          throw new Error(error.message);
        }

        console.log("Successfully created relocation:", data);
        return data;
      } catch (error) {
        console.error("Error in createRelocation mutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Mutation succeeded, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      toast.success('Relocation scheduled successfully');
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      console.error('Error in mutation:', error);
      toast.error(error.message || 'Failed to schedule relocation');
    }
  });

  const onSubmit = async (values: FormValues) => {
    console.log("Form submitted with values:", values);
    
    try {
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

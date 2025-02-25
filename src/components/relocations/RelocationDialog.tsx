
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
      console.log("Submitting relocation with values:", values);

      // Prepare the data to match the database requirements
      const relocationData = {
        original_room_id: values.original_room_id,
        temporary_room_id: values.temporary_room_id,
        start_date: values.start_date,
        end_date: values.end_date,
        reason: values.reason,
        relocation_type: values.relocation_type,
        status: 'scheduled' as const,
        notes: values.special_instructions || '',
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      console.log("Prepared relocation data:", relocationData);

      const { data, error } = await supabase
        .from('room_relocations')
        .insert(relocationData)
        .select()
        .single();

      if (error) {
        console.error("Supabase error details:", error);
        throw new Error(`Failed to create relocation: ${error.message}`);
      }

      console.log("Successfully created relocation:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      toast.success('Relocation scheduled successfully');
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      console.error('Error creating relocation:', error);
      toast.error(error.message || 'Failed to schedule relocation');
    }
  });

  const onSubmit = async (values: FormValues) => {
    try {
      console.log("Form submitted with values:", values);
      
      // Validate dates
      const startDate = new Date(values.start_date);
      const endDate = new Date(values.end_date);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        toast.error("Invalid date format");
        return;
      }
      
      if (endDate <= startDate) {
        toast.error("End date must be after start date");
        return;
      }

      await createRelocation.mutateAsync(values);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Failed to submit form");
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
                disabled={createRelocation.isPending || !form.formState.isValid}
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

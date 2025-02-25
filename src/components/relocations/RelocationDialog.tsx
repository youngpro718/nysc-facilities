
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
      // Prepare the data to match the database requirements
      const relocationData = {
        original_room_id: values.original_room_id,
        temporary_room_id: values.temporary_room_id,
        start_date: values.start_date,
        end_date: values.end_date,
        reason: values.reason,
        relocation_type: values.relocation_type,
        status: 'scheduled',
        notes: values.special_instructions || ''
      };

      const { data, error } = await supabase
        .from('room_relocations')
        .insert(relocationData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      toast.success('Relocation scheduled successfully');
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error('Failed to schedule relocation');
      console.error('Error creating relocation:', error);
    }
  });

  const onSubmit = (values: FormValues) => {
    createRelocation.mutate(values);
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
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRelocation.isPending}>
                {createRelocation.isPending ? "Creating..." : "Create Relocation"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

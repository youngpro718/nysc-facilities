
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RoomFormContent } from "./RoomFormContent";
import { RoomFormData, RoomFormSchema } from "./RoomFormSchema";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface EditRoomFormProps {
  id: string;
  initialData: Partial<RoomFormData>;
  onSuccess?: () => void;
  onCancel: () => void;
}

export function EditRoomForm({
  id,
  initialData,
  onSuccess,
  onCancel,
}: EditRoomFormProps) {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  
  const form = useForm<RoomFormData>({
    resolver: zodResolver(RoomFormSchema),
    defaultValues: {
      ...initialData,
      type: "room", // Force type to be room for the edit form
    },
  });

  const updateSpaceMutation = useMutation({
    mutationFn: async (data: RoomFormData) => {
      // Update the basic space data
      const spaceData = {
        name: data.name,
        status: data.status,
        room_number: data.roomNumber,
        position: data.position || { x: 0, y: 0 },
        size: data.size || { width: 150, height: 100 },
        rotation: data.rotation || 0,
        properties: {
          description: data.description
        }
      };

      const { error: spaceError } = await supabase
        .from('new_spaces')
        .update(spaceData)
        .eq('id', id);

      if (spaceError) throw spaceError;

      // Update room properties
      const roomProps = {
        room_type: data.roomType,
        current_function: data.currentFunction,
        is_storage: data.isStorage,
        storage_type: data.storageType,
        storage_capacity: data.storageCapacity,
        storage_notes: data.storageNotes,
        parent_room_id: data.parentRoomId,
        phone_number: data.phoneNumber,
      };

      // Check if room properties exist
      const { data: existingProps, error: checkError } = await supabase
        .from('room_properties')
        .select('*')
        .eq('space_id', id)
        .maybeSingle();

      if (checkError) throw checkError;

      // Insert or update room properties
      if (existingProps) {
        const { error: updateError } = await supabase
          .from('room_properties')
          .update(roomProps)
          .eq('space_id', id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('room_properties')
          .insert([{ ...roomProps, space_id: id }]);

        if (insertError) throw insertError;
      }

      return { success: true };
    },
    onSuccess: () => {
      // Refresh room data
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['space', id] });
      toast.success("Room updated successfully");
      
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update room");
    }
  });

  const handleSubmit = async (data: RoomFormData) => {
    try {
      setIsPending(true);
      await updateSpaceMutation.mutateAsync(data);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-6">
          <RoomFormContent 
            form={form}
            roomId={id}
          />
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isPending || !form.formState.isDirty}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

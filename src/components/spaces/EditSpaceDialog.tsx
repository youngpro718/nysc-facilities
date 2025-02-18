
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { editSpaceSchema, type EditSpaceFormData } from './schemas/editSpaceSchema';
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { EditSpaceDialogContent } from "./EditSpaceDialogContent";
import { getInitialSpaceData } from "./utils/getInitialSpaceData";

interface EditSpaceDialogProps {
  id: string;
  type: "room" | "door" | "hallway";
  initialData?: Partial<EditSpaceFormData>;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  variant?: "button" | "custom";
  onSpaceUpdated?: () => void;
}

export const EditSpaceDialog = ({
  id,
  type,
  initialData,
  open: controlledOpen,
  setOpen: controlledSetOpen,
  variant = "button",
  onSpaceUpdated,
}: EditSpaceDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledSetOpen ?? setInternalOpen;

  const defaultValues = getInitialSpaceData(id, type, initialData);

  const form = useForm<EditSpaceFormData>({
    resolver: zodResolver(editSpaceSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, form, defaultValues]);

  const queryClient = useQueryClient();
  
  const editSpaceMutation = useMutation({
    mutationFn: async (data: EditSpaceFormData) => {
      console.log("Updating space with data:", data);
      
      let query;
      
      const updateData = data.type === "room" ? {
        name: data.name,
        room_number: data.roomNumber,
        room_type: data.roomType,
        status: data.status,
        description: data.description,
        is_storage: data.isStorage,
        storage_capacity: data.storageCapacity,
        storage_type: data.isStorage ? data.storageType : null,
        storage_notes: data.storageNotes,
        parent_room_id: data.parentRoomId,
        current_function: data.currentFunction,
        phone_number: data.phoneNumber,
        floor_id: data.floorId,
      } : data.type === "door" ? {
        name: data.name,
        type: data.doorType,
        status: data.status,
        security_level: data.securityLevel,
        passkey_enabled: data.passkeyEnabled,
        floor_id: data.floorId,
      } : {
        name: data.name,
        type: data.hallwayType,
        section: data.section,
        status: data.status,
        notes: data.notes,
        floor_id: data.floorId,
      };

      if (data.type === "room") {
        query = supabase.from("rooms");
      } else if (data.type === "door") {
        query = supabase.from("doors");
      } else {
        query = supabase.from("hallways");
      }

      const { error } = await query
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${type}s`] });
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`);
      setOpen(false);
      if (onSpaceUpdated) onSpaceUpdated();
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update space");
    },
  });

  const handleSubmit = async (data: EditSpaceFormData) => {
    try {
      console.log("Submitting form with data:", data);
      await editSpaceMutation.mutateAsync(data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <>
      {variant === "button" && (
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => setOpen(true)}
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit {type}</DialogTitle>
            <DialogDescription>
              Make changes to your {type}. Click update when you're done.
            </DialogDescription>
          </DialogHeader>
          <EditSpaceDialogContent
            form={form}
            type={type}
            id={id}
            onSubmit={handleSubmit}
            isPending={editSpaceMutation.isPending}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

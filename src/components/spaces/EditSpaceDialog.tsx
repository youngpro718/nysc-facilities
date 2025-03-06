
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { RoomFormContent } from "./forms/room/RoomFormContent";
import { roomFormSchema, type RoomFormData } from "./forms/room/RoomFormSchema";
import { EditHallwayForm } from "./forms/hallway/EditHallwayForm";

interface EditSpaceDialogProps {
  id: string;
  type: "room" | "hallway";
  initialData?: any;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  variant?: "button" | "custom";
  onSpaceUpdated?: () => void;
}

export function EditSpaceDialog({
  id,
  type,
  initialData,
  open: controlledOpen,
  setOpen: controlledSetOpen,
  variant = "button",
  onSpaceUpdated,
}: EditSpaceDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledSetOpen ?? setInternalOpen;

  const form = useForm<RoomFormData>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: initialData,
  });

  useEffect(() => {
    if (open && initialData) {
      form.reset(initialData);
    }
  }, [open, form, initialData]);

  const queryClient = useQueryClient();

  const editSpaceMutation = useMutation({
    mutationFn: async (data: RoomFormData) => {
      console.log("Submitting data for room update:", data);
      
      const updateData = {
        name: data.name,
        room_number: data.roomNumber,
        room_type: data.roomType,
        status: data.status,
        description: data.description,
        is_storage: data.isStorage,
        storage_type: data.isStorage ? data.storageType : null,
        storage_capacity: data.storageCapacity,
        storage_notes: data.storageNotes,
        parent_room_id: data.parentRoomId,
        current_function: data.currentFunction,
        phone_number: data.phoneNumber,
        floor_id: data.floorId,
      };

      const { error: roomError } = await supabase
        .from("rooms")
        .update(updateData)
        .eq('id', id);

      if (roomError) throw roomError;
      
      if (data.connections && data.connections.length > 0) {
        const { data: existingConnections, error: fetchError } = await supabase
          .from("space_connections")
          .select("id")
          .eq("from_space_id", id)
          .eq("status", "active");
          
        if (fetchError) throw fetchError;
        
        const existingIds = (existingConnections || []).map(c => c.id);
        
        const keepConnectionIds: string[] = [];
        
        for (const connection of data.connections) {
          if (connection.id) {
            keepConnectionIds.push(connection.id);
            
            const { error: updateError } = await supabase
              .from("space_connections")
              .update({
                to_space_id: connection.toSpaceId,
                connection_type: connection.connectionType,
                direction: connection.direction,
              })
              .eq("id", connection.id);
              
            if (updateError) throw updateError;
          } else if (connection.toSpaceId && connection.connectionType) {
            const { error: insertError } = await supabase
              .from("space_connections")
              .insert({
                from_space_id: id,
                to_space_id: connection.toSpaceId,
                space_type: "room",
                connection_type: connection.connectionType,
                direction: connection.direction,
                status: "active"
              });
              
            if (insertError) throw insertError;
          }
        }
        
        const connectionsToDelete = existingIds.filter(id => !keepConnectionIds.includes(id));
        
        if (connectionsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from("space_connections")
            .update({ status: "inactive" })
            .in("id", connectionsToDelete);
            
          if (deleteError) throw deleteError;
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-connections', id] });
      queryClient.invalidateQueries({ queryKey: ['floorplan-objects'] });
      toast.success("Room updated successfully");
      setOpen(false);
      if (onSpaceUpdated) onSpaceUpdated();
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update room");
    },
  });

  const handleSubmit = async (data: RoomFormData) => {
    console.log("Handling submit with data:", data);
    await editSpaceMutation.mutateAsync(data);
  };

  const renderContent = () => {
    if (type === 'hallway') {
      return (
        <EditHallwayForm 
          id={id}
          initialData={initialData}
          onSuccess={() => {
            setOpen(false);
            if (onSpaceUpdated) onSpaceUpdated();
          }}
          onCancel={() => setOpen(false)}
        />
      );
    }
    
    return (
      <RoomFormContent
        form={form}
        onSubmit={handleSubmit}
        isPending={editSpaceMutation.isPending}
        onCancel={() => setOpen(false)}
        roomId={id}
      />
    );
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
            <DialogTitle>{type === 'hallway' ? 'Edit Hallway' : 'Edit Room'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[80vh] overflow-y-auto">
            <div className="p-1">
              {renderContent()}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

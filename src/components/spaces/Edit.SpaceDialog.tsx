
// Import necessary components and libraries
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RoomTypeEnum, StatusEnum, StorageTypeEnum } from "./rooms/types/roomEnums";
import { RoomFormContent } from "./forms/room/RoomFormContent";
import { roomFormSchema, type RoomFormData } from "./forms/room/RoomFormSchema";
import { EditHallwayForm } from "./forms/hallway/EditHallwayForm";
import { RoomType } from "./rooms/types/RoomTypes";

interface EditSpaceDialogProps {
  id: string;
  type: "room" | "hallway";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function EditSpaceDialog({ id, type, open, onOpenChange, onUpdate }: EditSpaceDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const roomForm = useForm<RoomFormData>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: "",
      roomNumber: "",
      roomType: RoomTypeEnum.OFFICE,
      status: StatusEnum.ACTIVE,
      description: "",
      isStorage: false,
      storageType: null,
      storageCapacity: null,
      storageNotes: null,
      parentRoomId: null,
      floorId: "",
      type: "room",
      connections: []
    }
  });

  useEffect(() => {
    if (open && id) {
      loadSpaceData();
    }
  }, [open, id]);

  const loadSpaceData = async () => {
    if (type === "room") {
      // Load room data
      const { data: room, error } = await supabase
        .from("rooms")
        .select(`
          *,
          space_connections(*)
        `)
        .eq("id", id)
        .single();

      if (error) {
        toast.error("Failed to load room data");
        console.error(error);
        return;
      }

      // Transform the data to match form structure
      roomForm.reset({
        id: room.id,
        name: room.name,
        roomNumber: room.room_number,
        roomType: room.room_type as RoomTypeEnum,
        status: room.status as StatusEnum,
        description: room.description || "",
        isStorage: room.is_storage || false,
        storageType: room.storage_type as StorageTypeEnum,
        storageCapacity: room.storage_capacity,
        storageNotes: room.storage_notes,
        parentRoomId: room.parent_room_id,
        floorId: room.floor_id,
        type: "room",
        connections: (room.space_connections || []).map((conn: any) => ({
          id: conn.id,
          toSpaceId: conn.to_space_id,
          connectionType: conn.connection_type,
          direction: conn.direction
        }))
      });
    }
  };

  const handleUpdateRoom = async (data: RoomFormData) => {
    try {
      setIsLoading(true);
      console.log("Updating room with data:", data);
      
      // Prepare room data for update
      const updateData = {
        name: data.name,
        room_number: data.roomNumber,
        room_type: data.roomType,
        status: data.status,
        description: data.description,
        is_storage: data.isStorage,
        storage_type: data.storageType,
        storage_capacity: data.storageCapacity,
        storage_notes: data.storageNotes,
        parent_room_id: data.parentRoomId,
        floor_id: data.floorId
      };
      
      console.log("Room update payload:", updateData);
      
      // Update room
      const { error: roomError } = await supabase
        .from("rooms")
        .update(updateData)
        .eq("id", data.id);
      
      if (roomError) {
        throw roomError;
      }

      if (data.connections && data.connections.length > 0) {
        console.log("Processing connections:", data.connections);
        
        const { data: existingConnections, error: fetchError } = await supabase
          .from("space_connections")
          .select("id")
          .eq("from_space_id", data.id);
        
        if (fetchError) {
          throw fetchError;
        }
        
        // Get existing connection IDs
        const existingIds = existingConnections.map((conn: any) => conn.id);
        console.log("Existing connection IDs:", existingIds);
        
        const keepConnectionIds: string[] = [];
        
        for (const connection of data.connections) {
          if (connection.id) {
            keepConnectionIds.push(connection.id);
            
            const { error: updateError } = await supabase
              .from("space_connections")
              .update({
                to_space_id: connection.toSpaceId,
                connection_type: connection.connectionType,
                direction: connection.direction
              })
              .eq("id", connection.id);
            
            if (updateError) {
              console.error("Error updating connection:", updateError);
              throw updateError;
            }
          } else if (connection.toSpaceId && connection.connectionType) {
            const { error: insertError } = await supabase
              .from("space_connections")
              .insert({
                from_space_id: data.id,
                to_space_id: connection.toSpaceId,
                connection_type: connection.connectionType,
                direction: connection.direction,
                status: "active"
              });
            
            if (insertError) {
              console.error("Error creating connection:", insertError);
              throw insertError;
            }
          }
        }
        
        const connectionsToDelete = existingIds.filter(id => !keepConnectionIds.includes(id));
        console.log("Connections to delete:", connectionsToDelete);
        
        if (connectionsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from("space_connections")
            .delete()
            .in("id", connectionsToDelete);
          
          if (deleteError) {
            console.error("Error deleting connections:", deleteError);
            throw deleteError;
          }
        }
      }

      toast.success("Room updated successfully");
      onUpdate?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update room:", error);
      toast.error("Failed to update room");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {type === "room" ? "Room" : "Hallway"}</DialogTitle>
        </DialogHeader>
        
        {type === "room" ? (
          <RoomFormContent
            form={roomForm}
            onSubmit={handleUpdateRoom}
            isPending={isLoading}
            onCancel={() => onOpenChange(false)}
            roomId={id}
          />
        ) : (
          <EditHallwayForm
            id={id}
            onClose={() => onOpenChange(false)}
            onSuccess={onUpdate}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

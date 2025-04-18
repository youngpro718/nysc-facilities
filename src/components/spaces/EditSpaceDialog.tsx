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
import { RoomFormSchema, type RoomFormData, ConnectionDirections } from "./forms/room/RoomFormSchema";
import { EditHallwayForm } from "./forms/hallway/EditHallwayForm";
import { storageService } from "@/services/storage"; 
import { 
  StatusEnum, 
  RoomTypeEnum, 
  StorageTypeEnum, 
  roomTypeToString, 
  statusToString, 
  storageTypeToString,
  stringToRoomType
} from "./rooms/types/roomEnums";

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
    resolver: zodResolver(RoomFormSchema),
    defaultValues: {
      ...initialData,
      type: type === "room" ? "room" : "hallway",
      connections: initialData?.space_connections || initialData?.connections || []
    },
  });

  useEffect(() => {
    if (open && initialData) {
      console.log("Resetting form with initial data:", initialData);
      
      const connections = initialData.space_connections || initialData.connections || [];
      
      const courtroom_photos = initialData.courtroom_photos;
      
      const mappedConnections = Array.isArray(connections) ? connections.map((conn: any) => {
        let direction = conn.direction || conn.connectionDirection;
        if (!direction || !ConnectionDirections.includes(direction as any)) {
          direction = "north"; // Default to north if invalid or missing
        }
        
        return {
          id: conn.id,
          toSpaceId: conn.to_space_id || conn.toSpaceId,
          connectionType: conn.connection_type || conn.connectionType,
          direction: direction
        };
      }) : [];
      
      // Log the room type from database for debugging
      console.log("Room type from database:", initialData.room_type);
      const convertedRoomType = initialData.room_type ? stringToRoomType(initialData.room_type) : undefined;
      console.log("Converted room type:", convertedRoomType);
      
      // Create a complete reset object with all form fields properly mapped
      const resetData = {
        ...initialData,
        type: type === "room" ? "room" : "hallway",
        roomNumber: initialData.room_number,
        roomType: convertedRoomType,
        isStorage: initialData.is_storage || false,
        storageType: initialData.storage_type ? initialData.storage_type : undefined,
        storageCapacity: initialData.storage_capacity,
        storageNotes: initialData.storage_notes,
        parentRoomId: initialData.parent_room_id,
        currentFunction: initialData.current_function,
        phoneNumber: initialData.phone_number,
        courtroom_photos: courtroom_photos,
        connections: mappedConnections
      };
      
      console.log("Form reset data:", resetData);
      form.reset(resetData);
      
      // Use setTimeout to ensure the form values are properly set after the initial render
      setTimeout(() => {
        if (convertedRoomType) {
          form.setValue("roomType", convertedRoomType);
        }
      }, 0);
    }
  }, [open, form, initialData, type]);

  const queryClient = useQueryClient();

  const editSpaceMutation = useMutation({
    mutationFn: async (data: RoomFormData) => {
      console.log("Submitting data for room update:", data);
      
      const updateData = {
        name: data.name,
        room_number: data.roomNumber,
        room_type: data.roomType ? roomTypeToString(data.roomType as RoomTypeEnum) : null,
        status: data.status ? statusToString(data.status as StatusEnum) : null,
        description: data.description || null,
        is_storage: data.isStorage,
        storage_type: data.isStorage && data.storageType ? storageTypeToString(data.storageType as StorageTypeEnum) : null,
        storage_capacity: data.storageCapacity || null,
        storage_notes: data.storageNotes || null,
        parent_room_id: data.parentRoomId || null,
        current_function: data.currentFunction || null,
        phone_number: data.phoneNumber || null,
        floor_id: data.floorId,
        courtroom_photos: data.courtroom_photos || null
      };

      console.log("Room update data:", updateData);
      
      if (data.roomType === RoomTypeEnum.COURTROOM) {
        try {
          await storageService.ensureBucketsExist(['courtroom-photos']);
          
          if (data.courtroom_photos && data.id) {
            const validUrls = Object.values(data.courtroom_photos).filter(Boolean) as string[];
            if (validUrls.length > 0) {
              await storageService.cleanupOrphanedFiles('courtroom-photos', data.id, validUrls);
            }
          }
        } catch (bucketError) {
          console.error('Error verifying storage bucket:', bucketError);
        }
      }
      
      const { error: roomError } = await supabase
        .from("rooms")
        .update(updateData as any)
        .eq('id', id);

      if (roomError) {
        console.error("Room update error:", roomError);
        throw roomError;
      }
      
      if (data.connections && data.connections.length > 0) {
        console.log("Processing connections:", data.connections);
        
        const { data: existingConnections, error: fetchError } = await supabase
          .from("space_connections")
          .select("id")
          .eq("from_space_id", id)
          .eq("status", "active");
          
        if (fetchError) {
          console.error("Error fetching connections:", fetchError);
          throw fetchError;
        }
        
        const existingIds = (existingConnections || []).map(c => c.id);
        console.log("Existing connection IDs:", existingIds);
        
        const keepConnectionIds: string[] = [];
        
        for (const connection of data.connections) {
          const direction = ConnectionDirections.includes(connection.direction as any) 
            ? connection.direction 
            : "north";
            
          if (connection.id) {
            keepConnectionIds.push(connection.id);
            
            console.log("Updating connection:", connection);
            const { error: updateError } = await supabase
              .from("space_connections")
              .update({
                to_space_id: connection.toSpaceId,
                connection_type: connection.connectionType,
                direction: direction,
              })
              .eq("id", connection.id);
              
            if (updateError) {
              console.error("Connection update error:", updateError);
              throw updateError;
            }
          } else if (connection.toSpaceId && connection.connectionType) {
            console.log("Creating new connection:", connection);
            const { error: insertError } = await supabase
              .from("space_connections")
              .insert({
                from_space_id: id,
                to_space_id: connection.toSpaceId,
                space_type: "room",
                connection_type: connection.connectionType,
                direction: direction,
                status: "active"
              });
              
            if (insertError) {
              console.error("Connection insert error:", insertError);
              throw insertError;
            }
          }
        }
        
        const connectionsToDelete = existingIds.filter(id => !keepConnectionIds.includes(id));
        console.log("Connections to delete:", connectionsToDelete);
        
        if (connectionsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from("space_connections")
            .update({ status: "inactive" })
            .in("id", connectionsToDelete);
            
          if (deleteError) {
            console.error("Connection delete error:", deleteError);
            throw deleteError;
          }
        }
      }
      
      return data;
    },
    onSuccess: () => {
      console.log("Update successful, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-connections', id] });
      queryClient.invalidateQueries({ queryKey: ['floorplan-objects'] });
      toast.success("Room updated successfully");
      setOpen(false);
      if (onSpaceUpdated) {
        console.log("Calling onSpaceUpdated callback");
        onSpaceUpdated();
      }
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


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
  stringToRoomType,
  stringToStatus,
  stringToStorageType
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
      id: id,
      type: "room",
      name: "",
      roomNumber: "",
      roomType: undefined,
      status: undefined,
      description: "",
      phoneNumber: "",
      isStorage: false,
      storageType: null,
      storageCapacity: null,
      storageNotes: null,
      parentRoomId: null,
      currentFunction: "",
      courtroom_photos: null,
      connections: [],
      floorId: ""
    },
  });

  // Initialize form data when dialog opens and we have initial data
  useEffect(() => {
    if (open && initialData && type === "room") {
      console.log("=== EDIT SPACE DIALOG DEBUG ===");
      console.log("Room ID:", id);
      console.log("Initial data received:", initialData);
      
      const connections = initialData.space_connections || initialData.connections || [];
      const courtroom_photos = initialData.courtroom_photos;
      
      const mappedConnections = Array.isArray(connections) ? connections.map((conn: any) => {
        let direction = conn.direction || conn.connectionDirection;
        if (!direction || !ConnectionDirections.includes(direction as any)) {
          direction = "north";
        }
        
        return {
          id: conn.id,
          toSpaceId: conn.to_space_id || conn.toSpaceId,
          connectionType: conn.connection_type || conn.connectionType,
          direction: direction
        };
      }) : [];
      
      // Convert enum values to their string representations that the form expects
      let convertedRoomType = initialData.room_type || undefined;
      let convertedStatus = initialData.status || undefined;
      let convertedStorageType = null;
      
      // For storage type, only set if the room is actually storage
      if (initialData.is_storage && initialData.storage_type) {
        convertedStorageType = initialData.storage_type;
      }
      
      console.log("Direct string values being set:");
      console.log("Room type:", convertedRoomType);
      console.log("Status:", convertedStatus);
      console.log("Storage type:", convertedStorageType);
      
      const formData: Partial<RoomFormData> = {
        id: id,
        type: "room",
        name: initialData.name || "",
        roomNumber: initialData.room_number || "",
        roomType: convertedRoomType,
        status: convertedStatus,
        description: initialData.description || "",
        phoneNumber: initialData.phone_number || "",
        isStorage: Boolean(initialData.is_storage),
        storageType: convertedStorageType,
        storageCapacity: initialData.storage_capacity || null,
        storageNotes: initialData.storage_notes || "",
        parentRoomId: initialData.parent_room_id || null,
        currentFunction: initialData.current_function || "",
        courtroom_photos: courtroom_photos || null,
        connections: mappedConnections,
        floorId: initialData.floor_id || ""
      };
      
      console.log("Final form data to be set:", formData);
      
      // Use setTimeout to ensure the form is ready
      setTimeout(() => {
        form.reset(formData);
        console.log("Form reset completed. Current form values:", form.getValues());
      }, 0);
    }
  }, [open, initialData, type, id, form]);

  const queryClient = useQueryClient();

  const editSpaceMutation = useMutation({
    mutationFn: async (data: RoomFormData) => {
      console.log("=== MUTATION START ===");
      console.log("Submitting data for room update:", data);
      
      if (!data.id && !id) {
        throw new Error("Room ID is missing - cannot update room");
      }
      
      if (!data.name) {
        throw new Error("Room name is required");
      }
      
      if (!data.floorId) {
        throw new Error("Floor ID is required");
      }
      
      const roomId = data.id || id;
      console.log("Using room ID for update:", roomId);
      
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

      console.log("Update data prepared:", updateData);
      
      if (data.roomType === RoomTypeEnum.COURTROOM) {
        try {
          await storageService.ensureBucketsExist(['courtroom-photos']);
          
          if (data.courtroom_photos && roomId) {
            const validUrls = Object.values(data.courtroom_photos).filter(Boolean) as string[];
            if (validUrls.length > 0) {
              await storageService.cleanupOrphanedFiles('courtroom-photos', roomId, validUrls);
            }
          }
        } catch (bucketError) {
          console.error('Error verifying storage bucket:', bucketError);
        }
      }
      
      console.log("Executing room update query...");
      const { error: roomError } = await supabase
        .from("rooms")
        .update(updateData as any)
        .eq('id', roomId);

      if (roomError) {
        console.error("Room update error:", roomError);
        throw new Error(`Failed to update room: ${roomError.message}`);
      }
      
      console.log("Room update successful");
      
      // Handle connections using the simplified approach
      if (data.connections && data.connections.length > 0) {
        console.log("Processing connections:", data.connections);
        
        const { data: existingConnections, error: fetchError } = await supabase
          .from("space_connections")
          .select("id")
          .eq("from_space_id", roomId)
          .eq("status", "active");
          
        if (fetchError) {
          console.error("Error fetching connections:", fetchError);
          throw new Error(`Failed to fetch connections: ${fetchError.message}`);
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
              throw new Error(`Failed to update connection: ${updateError.message}`);
            }
          } else if (connection.toSpaceId && connection.connectionType) {
            console.log("Creating new connection:", connection);
            const { error: insertError } = await supabase
              .from("space_connections")
              .insert({
                from_space_id: roomId,
                to_space_id: connection.toSpaceId,
                space_type: "room",
                connection_type: connection.connectionType,
                direction: direction,
                status: "active"
              });
              
            if (insertError) {
              console.error("Connection insert error:", insertError);
              throw new Error(`Failed to create connection: ${insertError.message}`);
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
            throw new Error(`Failed to deactivate connections: ${deleteError.message}`);
          }
        }
      }
      
      console.log("=== MUTATION SUCCESS ===");
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
      console.error("=== MUTATION ERROR ===");
      console.error("Update error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update room";
      toast.error(`Update failed: ${errorMessage}`);
    },
  });

  const handleSubmit = async (data: RoomFormData) => {
    console.log("=== HANDLE SUBMIT ===");
    console.log("Handling submit with data:", data);
    
    if (!data.id) {
      console.warn("ID missing in form data, setting from props");
      data.id = id;
    }
    
    const isValid = await form.trigger();
    if (!isValid) {
      console.error("Form validation failed:", form.formState.errors);
      toast.error("Please fix the validation errors before submitting");
      return;
    }
    
    try {
      await editSpaceMutation.mutateAsync(data);
    } catch (error) {
      console.error("Mutation failed:", error);
    }
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

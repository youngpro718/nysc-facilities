
import { useState, useEffect } from "react";
import { dbToFormRoom, formToDbRoom } from "./forms/room/roomFieldMapping";
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
  const [formReady, setFormReady] = useState(false);

  const form = useForm<RoomFormData>({
    resolver: zodResolver(RoomFormSchema),
    defaultValues: dbToFormRoom(initialData || {}, id),
  });

  // Initialize form data when dialog opens and we have initial data
  useEffect(() => {
    if (open && initialData && type === "room") {
      const formData = dbToFormRoom(initialData, id);
      setTimeout(() => {
        form.reset(formData);
        setFormReady(true);
      }, 0);
    } else {
      setFormReady(false);
    }
  }, [open, initialData, type, id, form]);

  const queryClient = useQueryClient();

  const editSpaceMutation = useMutation({
    mutationFn: async (data: RoomFormData) => {
      console.log("=== MUTATION START ===");
      console.log("Form data being submitted:", data);
      console.log("Parent room ID from form:", data.parentRoomId);
      const dbData = formToDbRoom(data);
      console.log("Submitting data for room update (DB format):", dbData);
      console.log("Parent room ID in DB format:", dbData.parent_room_id);
      
      if (!dbData.id && !id) {
        throw new Error("Room ID is missing - cannot update room");
      }
      
      if (!dbData.name) {
        throw new Error("Room name is required");
      }
      
      if (!dbData.floor_id) {
        throw new Error("Floor ID is required");
      }
      
      const roomId = dbData.id || id;
      console.log("Using room ID for update:", roomId);
      
      // Handle courtroom photo storage cleanup if needed
      if (dbData.room_type === RoomTypeEnum.COURTROOM) {
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

      // Use the new updateSpace service for updating the room
      await import("./services/updateSpace").then(async ({ updateSpace }) => {
        await updateSpace(roomId, dbData);
      });
      // Handle connections using simplified approach - removed since space_connections table doesn't exist
      console.log("Room update successful");
      
      console.log("=== MUTATION SUCCESS ===");
      return data;
    },
    onSuccess: () => {
      console.log("Update successful, invalidating queries");
      console.log("Invalidating queries for room hierarchy display");
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-connections', id] });
      queryClient.invalidateQueries({ queryKey: ['floorplan-objects'] });
      // Also invalidate any parent chain queries
      queryClient.invalidateQueries({ queryKey: ['parent-chain'] });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
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
    console.log("=== HANDLE SUBMIT CALLED ===");
    console.log("Handling submit with data:", data);
    console.log("Parent room ID in data:", data.parentRoomId);
    
    if (!data.id) {
      console.warn("ID missing in form data, setting from props");
      data.id = id;
    }
    
    console.log("About to trigger form validation...");
    const isValid = await form.trigger();
    console.log("Form validation result:", isValid);
    
    if (!isValid) {
      console.error("Form validation failed:", form.formState.errors);
      console.error("Detailed validation errors:", JSON.stringify(form.formState.errors, null, 2));
      toast.error("Please fix the validation errors before submitting");
      return;
    }
    
    console.log("Form validation passed, calling mutation...");
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

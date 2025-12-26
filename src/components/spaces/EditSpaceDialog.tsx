
import { useState, useEffect } from "react";
import { dbToFormRoom, formToDbRoom } from "./forms/room/roomFieldMapping";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ModalFrame } from "@/components/common/ModalFrame";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { RoomFormContent } from "./forms/room/RoomFormContent";
import { RoomFormSchema, type RoomFormData, ConnectionDirections } from "./forms/room/RoomFormSchema";
import { EditHallwayForm } from "./forms/hallway/EditHallwayForm";
import { RoomEditWizard } from "./forms/room/wizard/RoomEditWizard";
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
  children?: React.ReactNode;
}

export function EditSpaceDialog({
  id,
  type,
  initialData,
  open: controlledOpen,
  setOpen: controlledSetOpen,
  variant = "button",
  onSpaceUpdated,
  children,
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
      const dbData = formToDbRoom(data);
      
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
      
      // Handle courtroom photo storage cleanup if needed
      if (dbData.room_type === RoomTypeEnum.COURTROOM) {
        try {
          await storageService.ensureBucketsExist(['courtroom-photos']);
          if (data.courtroom_photos && roomId) {
            // Handle array format - flatten all photo URLs
            const allPhotos = [
              ...(data.courtroom_photos.judge_view || []),
              ...(data.courtroom_photos.audience_view || [])
            ].filter(Boolean) as string[];
            if (allPhotos.length > 0) {
              await storageService.cleanupOrphanedFiles('courtroom-photos', roomId, allPhotos);
            }
          }
        } catch {
          // Silently handle bucket verification errors
        }
      }

      // Use the new updateSpace service for updating the room
      await import("./services/updateSpace").then(async ({ updateSpace }) => {
        await updateSpace(roomId, dbData);
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-connections', id] });
      queryClient.invalidateQueries({ queryKey: ['floorplan-objects'] });
      // Ensure enhanced room data (including occupancy) updates immediately
      queryClient.invalidateQueries({ queryKey: ['enhanced-room', id] });
      // Also invalidate any parent chain queries
      queryClient.invalidateQueries({ queryKey: ['parent-chain'] });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      toast.success("Room updated successfully");
      setOpen(false);
      if (onSpaceUpdated) {
        onSpaceUpdated();
      }
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to update room";
      toast.error(`Update failed: ${errorMessage}`);
    },
  });

  const handleSubmit = async (data: RoomFormData) => {
    if (!data.id) {
      data.id = id;
    }
    
    const isValid = await form.trigger();
    
    if (!isValid) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }
    
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
    
    // Use the progressive wizard for room editing
    return (
      <RoomEditWizard
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
          className="flex items-center"
          onClick={() => setOpen(true)}
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {variant === "custom" && children && (
        <div onClick={() => setOpen(true)}>
          {children}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <ModalFrame
          title={type === 'hallway' ? 'Edit Hallway' : 'Edit Room'}
          size="lg"
        >
          {renderContent()}
        </ModalFrame>
      </Dialog>
    </>
  );
}

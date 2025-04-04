
import { UseFormReturn } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { BasicRoomFields } from "./BasicRoomFields";
import { StorageFields } from "./StorageFields";
import { ParentRoomField, CAN_HAVE_PARENT_ROOM_TYPES } from "./ParentRoomField";
import { type RoomFormData } from "./RoomFormSchema";
import { Separator } from "@/components/ui/separator";
import { ConnectionsField } from "./ConnectionsField";
import { useEffect } from "react";
import { RoomTypeEnum } from "../../rooms/types/roomEnums";

export interface RoomFormProps {
  form: UseFormReturn<RoomFormData>;
  roomId?: string;
}

export interface RoomFormContentProps extends RoomFormProps {
  onSubmit: (data: RoomFormData) => Promise<void>;
  isPending: boolean;
  onCancel: () => void;
}

export function RoomFormContent({
  form,
  onSubmit,
  isPending,
  onCancel,
  roomId,
}: RoomFormContentProps) {
  const isStorage = form.watch("isStorage");
  const floorId = form.watch("floorId");
  const roomType = form.watch("roomType");
  
  // Handle parent room field based on room type
  useEffect(() => {
    if (!CAN_HAVE_PARENT_ROOM_TYPES.includes(roomType) && form.getValues("parentRoomId")) {
      form.setValue("parentRoomId", null);
    }
  }, [roomType, form]);
  
  // Handle storage fields based on isStorage flag
  useEffect(() => {
    if (!isStorage) {
      // If not storage, ensure these values are null
      form.setValue("storageType", null);
      form.setValue("storageCapacity", null);
      form.setValue("storageNotes", null);
    }
  }, [isStorage, form]);
  
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await form.handleSubmit(onSubmit)(e);
  };

  // Determine if this room can have a parent room
  const canHaveParent = CAN_HAVE_PARENT_ROOM_TYPES.includes(roomType);

  return (
    <div className="space-y-6">
      <BasicRoomFields form={form} />
      
      {isStorage && (
        <>
          <Separator />
          <StorageFields form={form} />
        </>
      )}

      {/* Only show parent room field if this room type can have a parent */}
      {canHaveParent && (
        <>
          <Separator />
          <ParentRoomField 
            form={form} 
            floorId={floorId}
            currentRoomId={roomId}
          />
        </>
      )}

      <Separator />

      <ConnectionsField 
        form={form}
        floorId={floorId}
        roomId={roomId}
      />
      
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          onClick={handleFormSubmit}
          disabled={isPending}
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
    </div>
  );
}

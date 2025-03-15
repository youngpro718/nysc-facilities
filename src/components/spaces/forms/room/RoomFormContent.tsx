
import { RoomFormProps } from "./types";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { BasicRoomFields } from "./BasicRoomFields";
import { StorageFields } from "./StorageFields";
import { ParentRoomField, CAN_HAVE_PARENT_ROOM_TYPES } from "./ParentRoomField";
import { type RoomFormData } from "./RoomFormSchema";
import { Separator } from "@/components/ui/separator";
import { ConnectionsField } from "./ConnectionsField";
import { CourtroomPhotoUpload } from "./CourtroomPhotoUpload";
import { toast } from "sonner";
import { useEffect } from "react";
import { RoomTypeEnum } from "../../rooms/types/roomEnums";

interface RoomFormContentProps extends RoomFormProps {
  onSubmit: (data: RoomFormData) => Promise<void>;
  isPending: boolean;
  onCancel: () => void;
  roomId?: string;
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
  
  // Initialize or reset courtRoomPhotos when room type changes
  useEffect(() => {
    if (roomType === RoomTypeEnum.COURTROOM) {
      // Make sure courtRoomPhotos is initialized as an object for courtrooms
      const currentValue = form.getValues("courtRoomPhotos");
      if (!currentValue) {
        form.setValue("courtRoomPhotos", { judge_view: null, audience_view: null });
      }
    } else {
      // Clear courtRoomPhotos if room type is not courtroom
      form.setValue("courtRoomPhotos", null);
    }
  }, [roomType, form]);
  
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get current form state
    console.log("Form state:", {
      isDirty: form.formState.isDirty,
      isValid: form.formState.isValid,
      errors: form.formState.errors
    });
    
    // Get current form values for debugging
    const formValues = form.getValues();
    console.log("Current form values:", formValues);
    
    // Ensure type field is set
    if (!formValues.type) {
      form.setValue("type", "room", { shouldValidate: true });
    }
    
    // For courtrooms, ensure courtRoomPhotos exists
    if (roomType === RoomTypeEnum.COURTROOM && !formValues.courtRoomPhotos) {
      form.setValue("courtRoomPhotos", { judge_view: null, audience_view: null }, { shouldValidate: true });
    }
    
    // Validate connections
    const connections = form.getValues("connections") || [];
    const validConnections = connections.filter(conn => conn.toSpaceId && conn.connectionType);
    
    if (connections.length !== validConnections.length) {
      toast.error("Some connections are invalid. Please check all connections have a space and type selected.");
      return;
    }
    
    try {
      // Check for any validation errors directly
      const isValid = await form.trigger();
      if (!isValid) {
        console.error("Form validation failed:", form.formState.errors);
        toast.error("Please correct the errors in the form before submitting.");
        return;
      }
      
      await form.handleSubmit(onSubmit)(e);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Form submission failed. Please check the console for details.");
    }
  };

  // Determine if this room can have a parent room
  const canHaveParent = CAN_HAVE_PARENT_ROOM_TYPES.includes(roomType);

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <BasicRoomFields form={form} />
        
        {isStorage && (
          <>
            <Separator />
            <StorageFields form={form} />
          </>
        )}

        {/* Add courtroom photo upload if room type is courtroom */}
        {roomType === RoomTypeEnum.COURTROOM && (
          <>
            <Separator />
            <CourtroomPhotoUpload form={form} />
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
      </form>
    </Form>
  );
}

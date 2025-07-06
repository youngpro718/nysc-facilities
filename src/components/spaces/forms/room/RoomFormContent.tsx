
import { RoomFormProps } from "./types";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { BasicRoomFields } from "./BasicRoomFields";
import { StorageFields } from "./StorageFields";
import { ParentRoomField } from "./ParentRoomField";
import { type RoomFormData } from "./RoomFormSchema";
import { Separator } from "@/components/ui/separator";
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
  // Always normalize roomType to string for UI logic
  const rawRoomType = form.watch("roomType");
  const roomType = typeof rawRoomType === 'string' ? rawRoomType : `${rawRoomType ?? ''}`;
  
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("=== FORM SUBMIT HANDLER ===");
    
    try {
      // Pre-validation cleanup to ensure proper values for validation
      const formValues = form.getValues();
      console.log("Current form values before cleanup:", formValues);
      
      // Critical: Ensure ID is present
      if (!formValues.id && roomId) {
        console.log("Setting missing ID from roomId prop:", roomId);
        form.setValue("id", roomId, { shouldValidate: false });
      }
      
      // Ensure type field is set
      if (!formValues.type) {
        form.setValue("type", "room", { shouldValidate: false });
      }
      
      // For courtrooms, ensure courtroom_photos exists
      if (roomType === RoomTypeEnum.COURTROOM && !formValues.courtroom_photos) {
        form.setValue("courtroom_photos", { judge_view: null, audience_view: null }, { shouldValidate: false });
      }
      
      // Validate connections
      const connections = form.getValues("connections") || [];
      const validConnections = connections.filter(conn => conn.toSpaceId && conn.connectionType);
      
      if (connections.length !== validConnections.length) {
        console.error("Invalid connections found:", connections);
        toast.error("Some connections are invalid. Please check all connections have a space and type selected.");
        return;
      }
      
      // Get updated form values after cleanup
      const cleanedFormValues = form.getValues();
      console.log("Form values after cleanup:", cleanedFormValues);
      console.log("Form ID after cleanup:", cleanedFormValues.id);
      
      // Trigger validation
      const isValid = await form.trigger();
      if (!isValid) {
        const errors = form.formState.errors;
        console.error("Form validation errors:", errors);
        
        // Show specific error messages
        const errorMessages = Object.entries(errors)
          .filter(([_, error]) => error?.message)
          .map(([field, error]) => `${field}: ${error?.message}`)
          .join(', ');
        
        toast.error(`Please correct the following errors: ${errorMessages || "Invalid form data"}`);
        return;
      }
      
      console.log("Form validation passed, calling onSubmit");
      await form.handleSubmit(onSubmit)(e);
    } catch (error) {
      console.error("Form submission error:", error);
      if (error instanceof Error) {
        toast.error(`Form submission failed: ${error.message}`);
      } else {
        toast.error("Form submission failed. Please check the console for details.");
      }
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <BasicRoomFields form={form} />
        
        {/* Add parent room field if floor is selected */}
        {floorId && (
          <>
            <Separator />
            <ParentRoomField form={form} floorId={floorId} currentRoomId={roomId} />
          </>
        )}
        
        <Separator />
        <StorageFields form={form} />

        {/* Add courtroom photo upload if room type is courtroom */}
        {roomType === RoomTypeEnum.COURTROOM && (
          <>
            <Separator />
            <CourtroomPhotoUpload form={form} />
          </>
        )}


        <Separator />


        
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

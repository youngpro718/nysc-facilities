
import { RoomFormProps } from "./types";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { BasicRoomFields } from "./BasicRoomFields";
import { StorageFields } from "./StorageFields";
import { ParentRoomField } from "./ParentRoomField";
import { type RoomFormData } from "./RoomFormSchema";
import { Separator } from "@/components/ui/separator";
import { ConnectionsField } from "./ConnectionsField";
import { toast } from "sonner";
import { FormButtons } from "@/components/ui/form-buttons";

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
  
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted, calling form.handleSubmit");
    
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
    
    // Validate connections
    const connections = form.getValues("connections") || [];
    const validConnections = connections.filter(conn => conn.toSpaceId && conn.connectionType);
    
    if (connections.length !== validConnections.length) {
      toast.error("Some connections are invalid. Please check all connections have a space and type selected.");
      return;
    }
    
    try {
      await form.handleSubmit(onSubmit)(e);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Form submission failed. Please check the console for details.");
    }
  };

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

        <Separator />
        
        <ParentRoomField 
          form={form} 
          floorId={floorId}
          currentRoomId={roomId}
        />

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


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
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted, calling form.handleSubmit");
    
    // Get current form values for debugging
    const formValues = form.getValues();
    console.log("Current form values:", formValues);
    
    // Check form state
    console.log("Form state:", {
      isDirty: form.formState.isDirty,
      isValid: form.formState.isValid,
      errors: form.formState.errors
    });
    
    return form.handleSubmit(onSubmit)(e);
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

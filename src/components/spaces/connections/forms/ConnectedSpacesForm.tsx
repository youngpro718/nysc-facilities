import { useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ConnectionTypeSelector } from "../ConnectionTypeSelector";
import { RoomConnectionForm } from "./RoomConnectionForm";
import { HallwayConnectionForm } from "./HallwayConnectionForm";
import { DoorConnectionForm } from "./DoorConnectionForm";
import { ConnectionType } from "../types/ConnectionTypes";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Space {
  id: string;
  name: string;
  type: string;
  floor_id?: string;
  security_level?: string;
  section?: string;
  room_number?: string;
}

interface ConnectedSpacesFormProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  availableSpaces: Space[];
  onConnectionTypeChange?: (type: ConnectionType) => void;
  selectedConnectionType?: ConnectionType;
  spaceType?: "room" | "hallway" | "door";
  onSuccess?: () => void;
}

export function ConnectedSpacesForm({ 
  onSubmit, 
  isLoading,
  availableSpaces,
  onConnectionTypeChange,
  selectedConnectionType = "room",
  spaceType = "room",
  onSuccess
}: ConnectedSpacesFormProps) {
  const [connectionType, setConnectionType] = useState<ConnectionType>(selectedConnectionType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm({
    defaultValues: {
      connectionType: selectedConnectionType,
      roomId: "",
      hallwayId: "",
      doorId: "",
      direction: "adjacent",
      position: "adjacent"
    }
  });

  const handleConnectionTypeChange = (type: ConnectionType) => {
    setConnectionType(type);
    form.setValue("connectionType", type);
    onConnectionTypeChange?.(type);
    setError(null); // Clear any previous errors
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Validate required fields based on connection type
      if (connectionType === "room" && !data.roomId) {
        throw new Error("Please select a room");
      }
      if (connectionType === "hallway" && !data.hallwayId) {
        throw new Error("Please select a hallway");
      }
      if (connectionType === "door" && !data.doorId) {
        throw new Error("Please select a door");
      }

      const result = await onSubmit(data);
      
      // Only reset and close if submission was successful
      form.reset();
      toast.success("Connection created successfully");
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting form:", error);
      setError(error instanceof Error ? error.message : "Failed to create connection");
      toast.error(error instanceof Error ? error.message : "Failed to create connection");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}
        
        <ConnectionTypeSelector
          value={connectionType}
          onChange={handleConnectionTypeChange}
          disabled={isLoading || isSubmitting}
          spaceType={spaceType}
          form={form}
        />

        {connectionType === "room" && (
          <RoomConnectionForm
            form={form}
            availableSpaces={availableSpaces}
            isDisabled={isLoading || isSubmitting}
          />
        )}

        {connectionType === "hallway" && (
          <HallwayConnectionForm
            form={form}
            availableSpaces={availableSpaces}
            isDisabled={isLoading || isSubmitting}
          />
        )}

        {connectionType === "door" && (
          <DoorConnectionForm
            form={form}
            availableSpaces={availableSpaces}
            isDisabled={isLoading || isSubmitting}
          />
        )}

        <Button 
          type="submit" 
          disabled={isLoading || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Connection...
            </>
          ) : (
            'Create Connection'
          )}
        </Button>
      </form>
    </Form>
  );
}

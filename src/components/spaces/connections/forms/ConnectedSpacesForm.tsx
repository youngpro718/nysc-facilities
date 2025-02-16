
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ConnectionTypeSelector } from "../ConnectionTypeSelector";
import { RoomConnectionForm } from "./RoomConnectionForm";
import { HallwayConnectionForm } from "./HallwayConnectionForm";
import { DoorConnectionForm } from "./DoorConnectionForm";
import { ConnectionType } from "../types/ConnectionTypes";
import { Loader2 } from "lucide-react";

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
}

export function ConnectedSpacesForm({ 
  onSubmit, 
  isLoading,
  availableSpaces 
}: ConnectedSpacesFormProps) {
  const [connectionType, setConnectionType] = useState<ConnectionType>("room");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm({
    defaultValues: {
      connectionType: "room" as ConnectionType,
      roomId: "",
      hallwayId: "",
      doorId: "",
      direction: "adjacent",
      position: "adjacent"
    }
  });

  const handleFormSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      form.reset();
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create separate mapped arrays for each connection type
  const roomSpaces = connectionType === "room" ? availableSpaces.map(space => ({
    id: space.id,
    name: space.name,
    room_type: space.type,
    room_number: space.room_number || "",
    floor_id: space.floor_id
  })) : [];

  const hallwaySpaces = connectionType === "hallway" ? availableSpaces.map(space => ({
    id: space.id,
    name: space.name,
    type: space.type,
    section: space.section,
    floor_id: space.floor_id
  })) : [];

  const doorSpaces = connectionType === "door" ? availableSpaces.map(space => ({
    id: space.id,
    name: space.name,
    type: space.type,
    security_level: space.security_level,
    floor_id: space.floor_id
  })) : [];

  const isFormDisabled = isLoading || isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <ConnectionTypeSelector
          value={connectionType}
          onChange={setConnectionType}
          form={form}
          disabled={isFormDisabled}
        />

        {connectionType === "room" && (
          <RoomConnectionForm 
            form={form} 
            availableRooms={roomSpaces}
            isLoading={isFormDisabled}
          />
        )}

        {connectionType === "hallway" && (
          <HallwayConnectionForm 
            form={form}
            availableHallways={hallwaySpaces}
            isLoading={isFormDisabled}
          />
        )}

        {connectionType === "door" && (
          <DoorConnectionForm 
            form={form}
            availableDoors={doorSpaces}
            isLoading={isFormDisabled}
          />
        )}

        <Button 
          type="submit" 
          disabled={isFormDisabled}
          className="w-full"
        >
          {isFormDisabled ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            "Add Connection"
          )}
        </Button>
      </form>
    </Form>
  );
}

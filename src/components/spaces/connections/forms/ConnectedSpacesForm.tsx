
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ConnectionTypeSelector } from "../ConnectionTypeSelector";
import { RoomConnectionForm } from "./RoomConnectionForm";
import { HallwayConnectionForm } from "./HallwayConnectionForm";
import { DoorConnectionForm } from "./DoorConnectionForm";
import { ConnectionType } from "../types/ConnectionTypes";

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ConnectionTypeSelector
          value={connectionType}
          onChange={setConnectionType}
          form={form}
          disabled={isLoading}
        />

        {connectionType === "room" && (
          <RoomConnectionForm 
            form={form} 
            availableRooms={roomSpaces}
            isLoading={isLoading}
          />
        )}

        {connectionType === "hallway" && (
          <HallwayConnectionForm 
            form={form}
            availableHallways={hallwaySpaces}
            isLoading={isLoading}
          />
        )}

        {connectionType === "door" && (
          <DoorConnectionForm 
            form={form}
            availableDoors={doorSpaces}
            isLoading={isLoading}
          />
        )}

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Connecting..." : "Add Connection"}
        </Button>
      </form>
    </Form>
  );
}

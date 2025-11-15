
import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "../RoomFormSchema";
import { ConnectionsField } from "./ConnectionFields";

export interface ConnectionsContainerProps {
  form: UseFormReturn<RoomFormData>;
  floorId: string;
  roomId?: string;
}

export function ConnectionsContainer({ form, floorId, roomId }: ConnectionsContainerProps) {
  // Space connections functionality is disabled - no space_connections table exists
  console.log("Connections disabled for room:", { floorId, roomId });

  return (
    <ConnectionsField
      form={form}
      floorId={floorId}
      roomId={roomId}
    />
  );
}

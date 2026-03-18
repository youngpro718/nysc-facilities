
import { UseFormReturn } from "react-hook-form";
import { logger } from '@/lib/logger';
import { RoomFormData } from "../RoomFormSchema";
import { ConnectionsField } from "./ConnectionFields";

export interface ConnectionsContainerProps {
  form: UseFormReturn<RoomFormData>;
  floorId: string;
  roomId?: string;
}

export function ConnectionsContainer({ form, floorId, roomId }: ConnectionsContainerProps) {
  // Space connections functionality is disabled - no space_connections table exists
  logger.debug("Connections disabled for room:", { floorId, roomId });

  return (
    <ConnectionsField
      form={form}
      floorId={floorId}
      roomId={roomId}
    />
  );
}

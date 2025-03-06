
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FormField, FormItem } from "@/components/ui/form";
import { RoomConnectionData } from "../../room/RoomFormSchema";
import { ConnectionFields } from "./ConnectionFields";
import { ConnectionsContainerProps } from "./types";

export function ConnectionsContainer({ form, floorId, roomId }: ConnectionsContainerProps) {
  const connections = form.watch("connections") || [];

  const { data: existingConnections } = useQuery({
    queryKey: ["room-connections", roomId],
    queryFn: async () => {
      if (!roomId) return null;
      return null; // Just for initialization check - actual data fetching is in useConnections
    },
    enabled: !!roomId
  });

  // Initialize connections from existing data
  useQuery({
    queryKey: ["initialize-room-connections", roomId, existingConnections],
    queryFn: async () => {
      if (!roomId || !existingConnections || connections.length > 0) {
        return null;
      }
      
      return null; // React-query will handle existing connections initialization
    },
    enabled: !!roomId && !!existingConnections
  });

  const handleAddConnection = (newConnection: RoomConnectionData) => {
    const updatedConnections = [...connections, newConnection];
    form.setValue("connections", updatedConnections);
  };

  const handleRemoveConnection = (index: number) => {
    const updatedConnections = [...connections];
    updatedConnections.splice(index, 1);
    form.setValue("connections", updatedConnections);
  };

  return (
    <FormField
      control={form.control}
      name="connections"
      render={() => (
        <FormItem className="space-y-4">
          <ConnectionFields
            floorId={floorId}
            roomId={roomId}
            connections={connections}
            onAddConnection={handleAddConnection}
            onRemoveConnection={handleRemoveConnection}
          />
        </FormItem>
      )}
    />
  );
}

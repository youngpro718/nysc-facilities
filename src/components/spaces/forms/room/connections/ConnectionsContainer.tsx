
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RoomFormData, RoomConnectionData } from "../RoomFormSchema";
import { UseFormReturn } from "react-hook-form";
import { ConnectionFields } from "./ConnectionFields";
import { SpaceOption } from "./types";

export interface ConnectionsContainerProps {
  form: UseFormReturn<RoomFormData>;
  floorId: string;
  roomId?: string;
}

export function ConnectionsContainer({ form, floorId, roomId }: ConnectionsContainerProps) {
  const connections = form.watch("connections") || [];
  const [connectedSpaceNames, setConnectedSpaceNames] = useState<Record<string, string>>({});

  // Fetch available spaces that can be connected
  const { data: spaces, isLoading } = useQuery({
    queryKey: ["spaces-for-connections", floorId, roomId],
    queryFn: async () => {
      if (!floorId) return [];
      
      // Fetch all active spaces from the same floor except the current room
      const { data: spaceData, error: spaceError } = await supabase
        .from("new_spaces")
        .select(`
          id,
          name,
          type,
          room_number
        `)
        .eq("floor_id", floorId)
        .neq("status", "inactive")
        .neq("id", roomId || 'none'); // Exclude current room
      
      if (spaceError) {
        console.error("Error fetching spaces for connections:", spaceError);
        throw spaceError;
      }
      
      // Format spaces for dropdown
      const formattedSpaces: SpaceOption[] = (spaceData || []).map(space => ({
        id: space.id,
        name: space.name,
        type: space.type,
        room_number: space.room_number
      }));
      
      return formattedSpaces;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: !!floorId,
    retry: 3
  });

  // Fetch names of already connected spaces
  useEffect(() => {
    const fetchConnectedSpaceNames = async () => {
      const spaceIds = connections
        .filter(c => c.toSpaceId)
        .map(c => c.toSpaceId);
      
      if (spaceIds.length === 0) return;
      
      const { data: spaceData, error } = await supabase
        .from("new_spaces")
        .select("id, name, type, room_number")
        .in("id", spaceIds);
        
      if (error) {
        console.error("Error fetching connected space names:", error);
        return;
      }
      
      const names: Record<string, string> = {};
      (spaceData || []).forEach(space => {
        names[space.id] = space.room_number 
          ? `${space.name} (${space.room_number})`
          : `${space.name} (${space.type})`;
      });
      
      setConnectedSpaceNames(names);
    };
    
    if (connections.length > 0) {
      fetchConnectedSpaceNames();
    }
  }, [connections]);

  const handleAddConnection = (connection: RoomConnectionData) => {
    // Validate connection before adding
    if (!connection.toSpaceId || !connection.connectionType) {
      return;
    }
    
    const updatedConnections = [...(form.getValues("connections") || []), connection];
    form.setValue("connections", updatedConnections, { shouldDirty: true });
  };

  const handleRemoveConnection = (indexToRemove: number) => {
    const updatedConnections = (form.getValues("connections") || []).filter(
      (_, index) => index !== indexToRemove
    );
    form.setValue("connections", updatedConnections, { shouldDirty: true });
  };

  return (
    <ConnectionFields
      floorId={floorId}
      roomId={roomId}
      connections={connections}
      onAddConnection={handleAddConnection}
      onRemoveConnection={handleRemoveConnection}
      spaces={spaces}
      isLoading={isLoading}
      connectedSpaceNames={connectedSpaceNames}
    />
  );
}

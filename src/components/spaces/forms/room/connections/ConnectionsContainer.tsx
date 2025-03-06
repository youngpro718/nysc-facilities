
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
      // Fetch rooms from the same floor
      const { data: rooms, error: roomsError } = await supabase
        .from("rooms")
        .select("id, name, room_number, room_type")
        .eq("floor_id", floorId)
        .neq("status", "inactive");
        
      if (roomsError) throw roomsError;
  
      // Fetch hallways from the same floor
      const { data: hallways, error: hallwaysError } = await supabase
        .from("hallways")
        .select("id, name, section")
        .eq("floor_id", floorId)
        .neq("status", "inactive");
        
      if (hallwaysError) throw hallwaysError;
  
      // Fetch doors from the same floor - using 'type' instead of the non-existent 'door_type' column
      const { data: doors, error: doorsError } = await supabase
        .from("doors")
        .select("id, name, type")
        .eq("floor_id", floorId)
        .neq("status", "inactive");
        
      if (doorsError) throw doorsError;
  
      // Format spaces for dropdown
      const allSpaces: SpaceOption[] = [
        ...(rooms || []).map(r => ({
          id: r.id,
          name: r.name,
          type: 'room',
          room_number: r.room_number
        })),
        ...(hallways || []).map(h => ({
          id: h.id,
          name: h.name,
          type: 'hallway'
        })),
        ...(doors || []).map(d => ({
          id: d.id,
          name: d.name,
          type: 'door'
        }))
      ];
  
      // Remove the current room from the list
      return allSpaces.filter(space => space.id !== roomId);
    },
    enabled: !!floorId
  });

  // Fetch names of already connected spaces
  useEffect(() => {
    const fetchConnectedSpaceNames = async () => {
      const spaceIds = connections
        .filter(c => c.toSpaceId)
        .map(c => c.toSpaceId as string);
      
      if (spaceIds.length === 0) return;
      
      const names: Record<string, string> = {};
      
      // Fetch rooms
      const { data: rooms } = await supabase
        .from("rooms")
        .select("id, name, room_number")
        .in("id", spaceIds);
        
      (rooms || []).forEach(room => {
        names[room.id] = `${room.name} (${room.room_number})`;
      });
      
      // Fetch hallways
      const { data: hallways } = await supabase
        .from("hallways")
        .select("id, name")
        .in("id", spaceIds);
        
      (hallways || []).forEach(hallway => {
        names[hallway.id] = hallway.name;
      });
      
      // Fetch doors
      const { data: doors } = await supabase
        .from("doors")
        .select("id, name")
        .in("id", spaceIds);
        
      (doors || []).forEach(door => {
        names[door.id] = door.name;
      });
      
      setConnectedSpaceNames(names);
    };
    
    fetchConnectedSpaceNames();
  }, [connections]);

  const handleAddConnection = (connection: RoomConnectionData) => {
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

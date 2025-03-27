
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RoomConnectionData } from "../../room/RoomFormSchema";
import { SpaceOption } from "./types";

export function useConnections(floorId: string, roomId?: string) {
  const [isAddingConnection, setIsAddingConnection] = useState(false);
  const [newConnection, setNewConnection] = useState<RoomConnectionData>({
    toSpaceId: undefined,
    connectionType: undefined,
    direction: undefined
  });

  const { data: spaces, isLoading: isLoadingSpaces } = useQuery({
    queryKey: ["floor-spaces", floorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("new_spaces")
        .select("id, name, type, room_number")
        .eq("floor_id", floorId)
        .eq("status", "active");

      if (error) throw error;
      
      return (data || []).filter(space => space.id !== roomId) as SpaceOption[];
    },
    enabled: !!floorId
  });

  const { data: existingConnections } = useQuery({
    queryKey: ["room-connections", roomId],
    queryFn: async () => {
      if (!roomId) return [];
      
      const { data, error } = await supabase
        .from("space_connections")
        .select(`
          id, 
          connection_type,
          direction,
          to_space_id,
          to_space:to_space_id (id, name, type, room_number)
        `)
        .eq("from_space_id", roomId)
        .eq("status", "active");

      if (error) throw error;
      return data || [];
    },
    enabled: !!roomId
  });

  const handleConnectionChange = (field: keyof RoomConnectionData, value: string) => {
    setNewConnection(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateConnection = () => {
    if (!newConnection.toSpaceId || !newConnection.connectionType) {
      toast.error("Please select a space and connection type");
      return false;
    }
    return true;
  };

  const resetConnectionForm = () => {
    setNewConnection({
      toSpaceId: undefined,
      connectionType: undefined,
      direction: undefined
    });
    setIsAddingConnection(false);
  };

  const getSpaceName = (spaceId?: string) => {
    if (!spaceId || !spaces) return "Unknown space";
    const space = spaces.find(s => s.id === spaceId);
    if (!space) return "Unknown space";
    
    return space.room_number 
      ? `${space.name} (${space.room_number})`
      : space.name;
  };

  return {
    spaces,
    existingConnections,
    isAddingConnection,
    setIsAddingConnection,
    newConnection,
    isLoadingSpaces,
    getSpaceName,
    handleConnectionChange,
    validateConnection,
    resetConnectionForm
  };
}

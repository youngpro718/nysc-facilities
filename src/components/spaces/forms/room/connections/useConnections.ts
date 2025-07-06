import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RoomConnectionData } from "../../room/RoomFormSchema";
import { SpaceOption } from "./types";

export function useConnections(floorId: string, roomId?: string) {
  const [isAddingConnection, setIsAddingConnection] = useState(false);
  const [newConnection, setNewConnection] = useState<RoomConnectionData>({
    toSpaceId: "",
    connectionType: "",
    direction: undefined
  });

  // Simplified spaces query using existing tables
  const { data: spaces, isLoading: isLoadingSpaces } = useQuery({
    queryKey: ["floor-spaces", floorId],
    queryFn: async () => {
      const [roomsResult, hallwaysResult] = await Promise.all([
        supabase.from('rooms').select('id, name, room_number').eq('floor_id', floorId).eq('status', 'active'),
        supabase.from('hallways').select('id, name').eq('floor_id', floorId).eq('status', 'active')
      ]);
      
      if (roomsResult.error) throw roomsResult.error;
      if (hallwaysResult.error) throw hallwaysResult.error;
      
      const allSpaces = [
        ...(roomsResult.data || []).map(item => ({ ...item, type: 'room' })),
        ...(hallwaysResult.data || []).map(item => ({ ...item, type: 'hallway', room_number: null }))
      ].filter(space => space.id !== roomId);
      
      return allSpaces as SpaceOption[];
    },
    enabled: !!floorId
  });

  // Disable connections for now since space_connections table doesn't exist
  const existingConnections: any[] = [];

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
      toSpaceId: "",
      connectionType: "",
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
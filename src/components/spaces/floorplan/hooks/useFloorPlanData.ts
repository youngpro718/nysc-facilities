
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FloorPlanLayer, FloorPlanNode, FloorPlanEdge, FloorPlanLayerDB } from "../types/floorPlanTypes";

function transformLayer(raw: FloorPlanLayerDB): FloorPlanLayer {
  const parsedData = typeof raw.data === 'string' ? JSON.parse(raw.data) : raw.data;
  
  return {
    id: raw.id,
    floor_id: raw.floor_id,
    type: raw.type,
    name: raw.name,
    order_index: raw.order_index,
    visible: raw.visible,
    data: parsedData || {}
  };
}

function transformRoomToNode(room: any): FloorPlanNode {
  // Generate a position if none exists
  const position = room.position || {
    x: Math.random() * 500, // Random initial position for testing
    y: Math.random() * 500
  };

  // Default size if none provided
  const size = room.size || {
    width: 150,
    height: 100
  };

  return {
    id: room.id,
    type: 'room',
    position: position,
    data: {
      label: room.name,
      type: 'room',
      size: size,
      style: {
        backgroundColor: '#e2e8f0',
        border: '1px solid #cbd5e1'
      },
      properties: {
        room_number: room.room_number,
        room_type: room.room_type,
        status: room.status
      }
    },
    zIndex: 0
  };
}

export function useFloorPlanData(floorId: string | null) {
  // Query for layers
  const { data: layers, isLoading: isLoadingLayers } = useQuery({
    queryKey: ['floorplan-layers', floorId],
    queryFn: async () => {
      if (!floorId) return [];
      
      const { data, error } = await supabase
        .from('floorplan_layers')
        .select('*')
        .eq('floor_id', floorId)
        .order('order_index');
        
      if (error) throw error;
      return (data || []).map(layer => transformLayer(layer as FloorPlanLayerDB));
    },
    enabled: !!floorId
  });

  // Query for rooms
  const { data: rooms, isLoading: isLoadingRooms } = useQuery({
    queryKey: ['rooms', floorId],
    queryFn: async () => {
      if (!floorId) return [];
      
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          id,
          name,
          room_number,
          room_type,
          status,
          position,
          size
        `)
        .eq('floor_id', floorId);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!floorId
  });

  // Transform rooms into floor plan objects
  const objects = rooms?.map(transformRoomToNode) || [];

  return {
    layers,
    objects,
    isLoading: isLoadingLayers || isLoadingRooms
  };
}

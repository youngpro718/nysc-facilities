
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FloorPlanLayer, FloorPlanNode, FloorPlanEdge, FloorPlanLayerDB, ROOM_COLORS } from "../types/floorPlanTypes";

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

function transformRoomToNode(room: any, index: number): FloorPlanNode {
  console.log('Transforming room:', room);

  return {
    id: room.id,
    type: 'room',
    position: {
      x: (index % 3) * 250,
      y: Math.floor(index / 3) * 200
    },
    data: {
      label: room.name,
      type: 'room',
      size: {
        width: 150,
        height: 100
      },
      style: {
        backgroundColor: ROOM_COLORS[room.room_type] || ROOM_COLORS.default,
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
      
      console.log('Fetching rooms for floor:', floorId);
      
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
        
      if (error) {
        console.error('Error fetching rooms:', error);
        throw error;
      }
      
      console.log('Fetched rooms:', data);
      return data || [];
    },
    enabled: !!floorId
  });

  // Transform rooms into floor plan objects
  const objects = rooms?.map((room, index) => transformRoomToNode(room, index)) || [];
  console.log('Transformed objects:', objects);

  return {
    layers,
    objects,
    isLoading: isLoadingLayers || isLoadingRooms
  };
}

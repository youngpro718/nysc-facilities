
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

function transformRoomToNode(room: any, lightingStatus: any, index: number): FloorPlanNode {
  console.log('Transforming room:', room);

  const lighting = lightingStatus?.find((status: any) => status.room_id === room.id);
  const hasLightingIssues = lighting && lighting.non_working_fixtures > 0;

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
        backgroundColor: hasLightingIssues ? '#fee2e2' : ROOM_COLORS[room.room_type] || ROOM_COLORS.default,
        border: hasLightingIssues ? '2px solid #ef4444' : '1px solid #cbd5e1'
      },
      properties: {
        room_number: room.room_number,
        room_type: room.room_type,
        status: room.status,
        lighting: lighting ? {
          working_fixtures: lighting.working_fixtures,
          non_working_fixtures: lighting.non_working_fixtures,
          total_fixtures: lighting.total_fixtures
        } : null
      }
    },
    zIndex: 0
  };
}

export function useFloorPlanData(floorId: string | null) {
  // Query for layers
  const layersQuery = useQuery({
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

  // Query for lighting status
  const lightingQuery = useQuery({
    queryKey: ['room-lighting-status', floorId],
    queryFn: async () => {
      if (!floorId) return [];
      
      const { data, error } = await supabase
        .from('room_lighting_status')
        .select('*');
        
      if (error) {
        console.error('Error fetching lighting status:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!floorId
  });

  // Query for rooms
  const roomsQuery = useQuery({
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
        
      if (error) {
        console.error('Error fetching rooms:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!floorId
  });

  // Transform rooms into floor plan objects
  const objects = roomsQuery.data?.map((room, index) => 
    transformRoomToNode(room, lightingQuery.data, index)
  ) || [];

  return {
    layers: layersQuery.data || [],
    objects,
    isLoading: layersQuery.isLoading || roomsQuery.isLoading || lightingQuery.isLoading
  };
}

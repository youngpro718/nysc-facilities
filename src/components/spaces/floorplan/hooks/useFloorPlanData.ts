
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

function transformSpaceToNode(space: any, index: number): FloorPlanNode {
  // Generate a grid-based position if none exists, using the index
  const defaultPosition = {
    x: (index % 3) * 200 + 50, // 3 spaces per row, 200px apart
    y: Math.floor(index / 3) * 150 + 50 // New row every 3 spaces, 150px apart
  };

  const spacePosition = space.position ? 
    (typeof space.position === 'string' ? JSON.parse(space.position) : space.position) :
    defaultPosition;

  // Default size based on object type
  const defaultSize = space.object_type === 'hallway' ? 
    { width: 300, height: 50 } :
    space.object_type === 'door' ?
    { width: 40, height: 10 } :
    { width: 150, height: 100 };

  const spaceSize = space.size ?
    (typeof space.size === 'string' ? JSON.parse(space.size) : space.size) :
    defaultSize;

  // Get background color based on type
  const backgroundColor = space.object_type === 'room' ? 
    ROOM_COLORS[space.type] || ROOM_COLORS.default :
    space.object_type === 'hallway' ?
    '#e5e7eb' : // Light gray for hallways
    '#94a3b8'; // Slate gray for doors

  return {
    id: space.id,
    type: space.object_type,
    position: spacePosition,
    data: {
      label: space.name,
      type: space.object_type,
      size: spaceSize,
      style: {
        backgroundColor,
        border: '1px solid #cbd5e1'
      },
      properties: {
        room_number: space.room_number,
        space_type: space.type,
        status: space.status,
        parent_room_id: space.parent_room_id,
        connection_data: space.connection_data
      }
    },
    zIndex: space.object_type === 'door' ? 2 : space.object_type === 'hallway' ? 1 : 0
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

  // Query for floor plan objects
  const { data: spaceObjects, isLoading: isLoadingObjects } = useQuery({
    queryKey: ['floorplan-objects', floorId],
    queryFn: async () => {
      if (!floorId) return [];
      
      console.log('Fetching floor plan objects for floor:', floorId);
      
      // Fetch rooms
      const { data: rooms = [], error: roomsError } = await supabase
        .from('rooms')
        .select('*, room_type as type')
        .eq('floor_id', floorId)
        .eq('status', 'active');

      if (roomsError) throw roomsError;

      const roomObjects = rooms.map(room => ({
        ...room,
        object_type: 'room'
      }));

      // Fetch hallways
      const { data: hallways = [], error: hallwaysError } = await supabase
        .from('hallways')
        .select('*')
        .eq('floor_id', floorId)
        .eq('status', 'active');

      if (hallwaysError) throw hallwaysError;

      const hallwayObjects = hallways.map(hallway => ({
        ...hallway,
        object_type: 'hallway'
      }));

      // Fetch doors
      const { data: doors = [], error: doorsError } = await supabase
        .from('doors')
        .select('*')
        .eq('floor_id', floorId)
        .eq('status', 'active');

      if (doorsError) throw doorsError;

      const doorObjects = doors.map(door => ({
        ...door,
        object_type: 'door'
      }));

      // Combine all objects
      const allObjects = [...roomObjects, ...hallwayObjects, ...doorObjects];
      console.log('Fetched floor plan objects:', allObjects);
      return allObjects;
    },
    enabled: !!floorId
  });

  // Transform all objects into floor plan nodes
  const objects = spaceObjects?.map((obj, index) => transformSpaceToNode(obj, index)) || [];
  console.log('Transformed objects:', objects);

  // Process parent/child relationships
  const processedObjects = objects.map(obj => {
    if (obj.data.properties.parent_room_id) {
      const parentObj = objects.find(parent => parent.id === obj.data.properties.parent_room_id);
      if (parentObj) {
        // Adjust position relative to parent
        obj.position = {
          x: parentObj.position.x + 50,
          y: parentObj.position.y + 50
        };
      }
    }
    return obj;
  });

  return {
    layers,
    objects: processedObjects,
    isLoading: isLoadingLayers || isLoadingObjects
  };
}

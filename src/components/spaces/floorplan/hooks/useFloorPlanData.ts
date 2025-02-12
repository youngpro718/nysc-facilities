
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

  // Get background color based on type and status
  const backgroundColor = getSpaceColor(space);

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
        border: space.status === 'active' ? '1px solid #cbd5e1' : '2px dashed #ef4444',
        opacity: space.status === 'active' ? 1 : 0.7
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

function getSpaceColor(space: any): string {
  if (space.object_type === 'room') {
    // Use room type colors with status variations
    const baseColor = ROOM_COLORS[space.type] || ROOM_COLORS.default;
    return space.status === 'active' ? baseColor : `${baseColor}80`; // Add transparency for inactive
  } else if (space.object_type === 'hallway') {
    return space.status === 'active' ? '#e5e7eb' : '#e5e7eb80';
  } else {
    return space.status === 'active' ? '#94a3b8' : '#94a3b880';
  }
}

function createEdgesFromConnections(connections: any[]): FloorPlanEdge[] {
  return connections.map(conn => ({
    id: conn.id,
    source: conn.from_space_id,
    target: conn.to_space_id,
    data: {
      type: conn.connection_type,
      style: {
        stroke: conn.status === 'active' ? '#64748b' : '#94a3b8',
        strokeWidth: 2,
        strokeDasharray: conn.status === 'active' ? '' : '5,5'
      }
    },
    type: 'smoothstep',
    animated: conn.connection_type === 'door'
  }));
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

  // Query for floor plan objects and connections
  const { data: spaceData, isLoading: isLoadingObjects } = useQuery({
    queryKey: ['floorplan-objects', floorId],
    queryFn: async () => {
      if (!floorId) return { objects: [], connections: [] };
      
      console.log('Fetching floor plan objects for floor:', floorId);
      
      // Fetch rooms
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('id, name, room_number, room_type, status, position, size, parent_room_id, floor_id')
        .eq('floor_id', floorId)
        .eq('status', 'active');

      if (roomsError) throw roomsError;

      const roomObjects = (rooms || []).map(room => ({
        id: room.id,
        name: room.name,
        room_number: room.room_number,
        type: room.room_type,
        status: room.status,
        position: room.position,
        size: room.size,
        parent_room_id: room.parent_room_id,
        floor_id: room.floor_id,
        object_type: 'room' as const
      }));

      // Fetch hallways
      const { data: hallways, error: hallwaysError } = await supabase
        .from('hallways')
        .select('id, name, type, status, position, size, floor_id')
        .eq('floor_id', floorId)
        .eq('status', 'active');

      if (hallwaysError) throw hallwaysError;

      const hallwayObjects = (hallways || []).map(hallway => ({
        id: hallway.id,
        name: hallway.name,
        type: hallway.type,
        status: hallway.status,
        position: hallway.position,
        size: hallway.size,
        floor_id: hallway.floor_id,
        object_type: 'hallway' as const
      }));

      // Fetch doors
      const { data: doors, error: doorsError } = await supabase
        .from('doors')
        .select('id, name, type, status, floor_id')
        .eq('floor_id', floorId)
        .eq('status', 'active');

      if (doorsError) throw doorsError;

      const doorObjects = (doors || []).map(door => ({
        id: door.id,
        name: door.name,
        type: door.type,
        status: door.status,
        floor_id: door.floor_id,
        object_type: 'door' as const
      }));

      // Fetch space connections
      const { data: connections, error: connectionsError } = await supabase
        .from('space_connections')
        .select('*')
        .eq('status', 'active');

      if (connectionsError) throw connectionsError;

      // Combine all objects
      const allObjects = [...roomObjects, ...hallwayObjects, ...doorObjects];
      console.log('Fetched floor plan objects:', allObjects);
      
      return {
        objects: allObjects,
        connections: connections || []
      };
    },
    enabled: !!floorId
  });

  // Transform all objects into floor plan nodes
  const objects = spaceData?.objects.map((obj, index) => transformSpaceToNode(obj, index)) || [];
  const edges = spaceData?.connections ? createEdgesFromConnections(spaceData.connections) : [];
  
  console.log('Transformed objects:', objects);
  console.log('Created edges:', edges);

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
    edges,
    isLoading: isLoadingLayers || isLoadingObjects
  };
}

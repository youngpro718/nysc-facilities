
import { useQuery } from "@tanstack/react-query";
import { transformLayer } from "../utils/layerTransforms";
import { transformSpaceToNode } from "../utils/nodeTransforms";
import { createEdgesFromConnections } from "../utils/edgeTransforms";
import { fetchFloorPlanLayers, fetchFloorPlanObjects } from "../queries/floorPlanQueries";
import { FloorPlanLayerDB, Position, FloorPlanObject, FloorPlanNode } from "../types/floorPlanTypes";

// Validate position data
function isValidPosition(pos: any): pos is Position {
  if (!pos || typeof pos !== 'object') return false;
  const x = Number(pos.x);
  const y = Number(pos.y);
  return !isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y);
}

// Parse position with validation
function parsePosition(positionData: any): Position | null {
  try {
    if (typeof positionData === 'string') {
      positionData = JSON.parse(positionData);
    }

    if (isValidPosition(positionData)) {
      return { x: Number(positionData.x), y: Number(positionData.y) };
    }

    console.warn('Invalid position data:', positionData);
    return null;
  } catch (error) {
    console.warn('Error parsing position:', error);
    return null;
  }
}

// Calculate automatic layout position
function calculateAutoPosition(index: number, size: { width: number; height: number }): Position {
  const PADDING = 50;
  const MAX_WIDTH = 1200; // Maximum width for the layout
  const itemsPerRow = Math.floor(MAX_WIDTH / (size.width + PADDING));
  const row = Math.floor(index / itemsPerRow);
  const col = index % itemsPerRow;

  return {
    x: col * (size.width + PADDING) + PADDING,
    y: row * (size.height + PADDING) + PADDING
  };
}

export function useFloorPlanData(floorId: string | null) {
  // Query for layers
  const { data: layers, isLoading: isLoadingLayers } = useQuery({
    queryKey: ['floorplan-layers', floorId],
    queryFn: async () => {
      if (!floorId) return [];
      const data = await fetchFloorPlanLayers(floorId);
      return data.map(layer => transformLayer(layer as FloorPlanLayerDB));
    },
    enabled: !!floorId
  });

  // Query for floor plan objects and connections
  const { data: spaceData, isLoading: isLoadingObjects } = useQuery({
    queryKey: ['floorplan-objects', floorId],
    queryFn: async () => {
      if (!floorId) return { objects: [], connections: [] };
      console.log('Fetching floor plan objects for floor:', floorId);
      return fetchFloorPlanObjects(floorId);
    },
    enabled: !!floorId
  });

  // Transform all objects into floor plan nodes
  const objects = spaceData?.objects.map((obj: FloorPlanObject, index): FloorPlanNode => {
    // Transform the object into a node first
    const node = transformSpaceToNode(obj, index);

    // Try to parse the position from the database
    const parsedPosition = parsePosition(obj.position);

    if (!parsedPosition) {
      console.log(`Using auto-layout for node ${node.id} due to invalid position`);
      node.position = calculateAutoPosition(index, node.data.size);
    } else {
      console.log(`Using stored position for node ${node.id}:`, parsedPosition);
      node.position = parsedPosition;
    }

    return node;
  }) || [];

  const edges = spaceData?.connections ? createEdgesFromConnections(spaceData.connections) : [];
  
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

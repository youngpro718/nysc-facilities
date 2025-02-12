
import { useQuery } from "@tanstack/react-query";
import { transformLayer } from "../utils/layerTransforms";
import { createEdgesFromConnections } from "../utils/edgeTransforms";
import { fetchFloorPlanLayers, fetchFloorPlanObjects } from "../queries/floorPlanQueries";
import { 
  FloorPlanLayerDB, 
  Position, 
  FloorPlanObject,
  FloorPlanNode,
  FloorPlanObjectData,
  FloorPlanObjectType,
  Size
} from "../types/floorPlanTypes";

function isValidPosition(pos: any): pos is Position {
  if (!pos || typeof pos !== 'object') return false;
  const x = Number(pos.x);
  const y = Number(pos.y);
  return !isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y);
}

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

function calculateAutoPosition(index: number, size: Size): Position {
  const PADDING = 50;
  const MAX_WIDTH = 1200;
  const itemsPerRow = Math.floor(MAX_WIDTH / (size.width + PADDING));
  const row = Math.floor(index / itemsPerRow);
  const col = index % itemsPerRow;

  return {
    x: col * (size.width + PADDING) + PADDING,
    y: row * (size.height + PADDING) + PADDING
  };
}

function getDefaultSize(type: FloorPlanObjectType): Size {
  switch (type) {
    case 'door':
      return { width: 60, height: 20 };
    case 'hallway':
      return { width: 200, height: 50 };
    case 'room':
    default:
      return { width: 150, height: 100 };
  }
}

function transformObjectToNode(obj: FloorPlanObject, index: number): FloorPlanNode {
  const type = obj.object_type as FloorPlanObjectType;
  const defaultSize = getDefaultSize(type);

  const nodeData: FloorPlanObjectData = {
    label: obj.name,
    type: type,
    size: defaultSize,
    style: {
      backgroundColor: type === 'door' ? '#94a3b8' : '#e2e8f0',
      border: type === 'door' ? '2px solid #475569' : '1px solid #cbd5e1'
    },
    properties: {
      type: obj.type,
      status: obj.status,
      room_number: 'room_number' in obj ? obj.room_number : undefined
    }
  };

  const parsedPosition = obj.position ? parsePosition(obj.position) : null;
  const position = parsedPosition || calculateAutoPosition(index, nodeData.size);

  return {
    id: obj.id,
    type: type,
    position,
    data: nodeData,
    draggable: true,
    selectable: true
  };
}

export function useFloorPlanData(floorId: string | null) {
  const { data: layers, isLoading: isLoadingLayers } = useQuery({
    queryKey: ['floorplan-layers', floorId],
    queryFn: async () => {
      if (!floorId) return [];
      const data = await fetchFloorPlanLayers(floorId);
      return data.map(layer => transformLayer(layer as FloorPlanLayerDB));
    },
    enabled: !!floorId
  });

  const { data: spaceData, isLoading: isLoadingObjects } = useQuery({
    queryKey: ['floorplan-objects', floorId],
    queryFn: async () => {
      if (!floorId) return { objects: [], connections: [] };
      console.log('Fetching floor plan objects for floor:', floorId);
      return fetchFloorPlanObjects(floorId);
    },
    enabled: !!floorId
  });

  const nodes = spaceData?.objects.map((obj, index) => 
    transformObjectToNode(obj as FloorPlanObject, index)
  ) || [];

  const edges = spaceData?.connections ? createEdgesFromConnections(spaceData.connections) : [];
  
  const processedNodes = nodes.map(node => {
    const properties = node.data.properties;
    if (properties?.parent_room_id) {
      const parentNode = nodes.find(n => n.id === properties.parent_room_id);
      if (parentNode) {
        return {
          ...node,
          position: {
            x: parentNode.position.x + 50,
            y: parentNode.position.y + 50
          }
        };
      }
    }
    return node;
  });

  return {
    layers,
    objects: processedNodes,
    edges,
    isLoading: isLoadingLayers || isLoadingObjects
  };
}

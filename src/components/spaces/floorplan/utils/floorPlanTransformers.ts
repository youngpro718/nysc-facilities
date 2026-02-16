// @ts-nocheck
import { RawFloorPlanObject, FloorPlanNode, Position, Size } from "../types/floorPlanTypes";
import { logger } from '@/lib/logger';
import { transformSpaceToNode } from "../utils/nodeTransforms";

/**
 * Transforms raw objects with positions into processed FloorPlanNodes.
 * Handles:
 * 1. Transformation to node format
 * 2. Error handling with fallback nodes
 * 3. Parent/Child room relationships
 * 4. Dynamic hallway sizing and orientation based on connections
 */
export function processFloorPlanObjects(
  objectsWithPositions: RawFloorPlanObject[], 
  edges: unknown[]
): FloorPlanNode[] {
  // 1. Basic transformation
  const nodes = objectsWithPositions.map((obj, index) => {
    try {
      return transformSpaceToNode(obj, index);
    } catch (error) {
      logger.error('Error transforming object to node:', error, obj);
      return createFallbackNode(obj, index);
    }
  });

  // 2. Post-processing for relationships and dynamic sizing
  return nodes.map(node => {
    // Handle parent/child room relationships
    if (node.data?.properties?.parent_room_id) {
      const parentNode = nodes.find(p => p.id === node.data.properties.parent_room_id);
      if (parentNode) {
        applyParentChildTransform(node, parentNode);
      }
    }

    // Process connected spaces
    if (node.type === 'hallway' || node.type === 'room') {
      enrichWithConnectedSpaces(node, nodes, edges);
    }

    // Dynamic hallway sizing
    if (node.type === 'hallway' && edges.length > 0) {
      applyHallwayDynamicSizing(node, nodes, edges);
    }

    return node;
  });
}

function createFallbackNode(obj: RawFloorPlanObject, index: number): FloorPlanNode {
  return {
    id: obj.id || `error-${index}`,
    type: obj.object_type || 'room',
    position: obj.position as Position || { x: index * 100, y: index * 100 },
    data: {
      label: obj.name || 'Error Object',
      type: obj.object_type || 'room',
      size: obj.size as Size || { width: 150, height: 100 },
      style: {
        backgroundColor: '#f87171',
        border: '1px dashed #ef4444',
        opacity: 0.7
      },
      properties: obj.properties || {},
      rotation: obj.rotation || 0
    },
    zIndex: 0
  };
}

function applyParentChildTransform(childNode: FloorPlanNode, parentNode: FloorPlanNode) {
  // Adjust position relative to parent
  childNode.position = {
    x: parentNode.position.x + 50,
    y: parentNode.position.y + 50
  };
  
  // Adjust size to be smaller than parent
  const parentSize = parentNode.data?.size;
  if (parentSize) {
    childNode.data.size = {
      width: Math.max(parentSize.width * 0.7, 100),
      height: Math.max(parentSize.height * 0.7, 80)
    };
  }
  
  // Inherit style properties but make it visually distinct
  if (childNode.data?.style) {
    childNode.data.style = {
      ...childNode.data.style,
      border: '1px dashed #64748b',
      opacity: 0.9
    };
  }
  
  // Increment zIndex to draw above parent
  childNode.zIndex = (parentNode.zIndex || 0) + 1;
}

function enrichWithConnectedSpaces(node: FloorPlanNode, allNodes: FloorPlanNode[], edges: unknown[]) {
  const connectedTo = edges
    .filter(edge => edge.source === node.id || edge.target === node.id)
    .map(edge => {
      const connectionId = edge.id;
      const connectedObjectId = edge.source === node.id ? edge.target : edge.source;
      const connectedObject = allNodes.find(o => o.id === connectedObjectId);
      
      return {
        id: connectedObjectId,
        connectionId,
        type: connectedObject?.type || 'unknown',
        name: connectedObject?.data?.label || 'Unknown'
      };
    });
  
  if (connectedTo.length > 0) {
    node.data.properties = {
      ...node.data.properties,
      connected_spaces: connectedTo
    };
  }
}

function applyHallwayDynamicSizing(hallwayNode: FloorPlanNode, allNodes: FloorPlanNode[], edges: unknown[]) {
  const hallwayConnections = edges.filter(edge => 
    edge.source === hallwayNode.id || edge.target === hallwayNode.id
  );
  
  if (hallwayConnections.length >= 2) {
    const connectedRooms = hallwayConnections.map(conn => {
      const roomId = conn.source === hallwayNode.id ? conn.target : conn.source;
      return allNodes.find(room => room.id === roomId);
    }).filter((n): n is FloorPlanNode => !!n);
    
    if (connectedRooms.length >= 2) {
      let minX = Math.min(...connectedRooms.map(room => room.position.x));
      let maxX = Math.max(...connectedRooms.map(room => room.position.x));
      let minY = Math.min(...connectedRooms.map(room => room.position.y));
      let maxY = Math.max(...connectedRooms.map(room => room.position.y));
      
      const xDistance = maxX - minX;
      const yDistance = maxY - minY;
      
      const isHorizontal = xDistance > yDistance;
      
      if (isHorizontal) {
        hallwayNode.data.size = {
          width: Math.max(xDistance + 200, 300),
          height: 50
        };
        hallwayNode.position = {
          x: (minX + maxX) / 2,
          y: hallwayNode.position.y
        };
        hallwayNode.data.rotation = 0;
      } else {
        hallwayNode.data.size = {
          width: 50,
          height: Math.max(yDistance + 200, 300)
        };
        hallwayNode.position = {
          x: hallwayNode.position.x,
          y: (minY + maxY) / 2
        };
        hallwayNode.data.rotation = 90;
      }
    }
  }
}

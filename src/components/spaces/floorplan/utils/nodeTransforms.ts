
import { FloorPlanNode } from "../types/floorPlanTypes";

/**
 * Transforms a space object from the database into a node for the floor plan visualization
 */
export function transformSpaceToNode(spaceObject: any, index: number): FloorPlanNode {
  if (!spaceObject) {
    console.error('Invalid space object provided to transformSpaceToNode');
    // Return fallback/default node to prevent UI crashes
    return {
      id: `fallback-${index}`,
      type: 'room',
      position: { x: 0, y: 0 },
      data: {
        label: 'Error Node',
        type: 'room', // Added the missing 'type' property
        size: { width: 100, height: 100 },
        style: { backgroundColor: '#ffcccc', border: '1px solid #ff0000' },
        properties: {},
        rotation: 0
      }
    };
  }

  try {
    // Extract position data with fallbacks
    const posX = parseFloat(spaceObject?.position_x || spaceObject?.x || 0);
    const posY = parseFloat(spaceObject?.position_y || spaceObject?.y || 0);
    
    // Validate position data
    const x = !isNaN(posX) ? posX : 0;
    const y = !isNaN(posY) ? posY : 0;
    
    // Extract dimensions with fallbacks
    const width = parseFloat(spaceObject?.width || 100);
    const height = parseFloat(spaceObject?.height || 100); 
    
    // Extract properties safely
    let properties = {};
    try {
      properties = typeof spaceObject.properties === 'string' 
        ? JSON.parse(spaceObject.properties) 
        : (spaceObject.properties || {});
    } catch (e) {
      console.warn('Failed to parse properties for space:', spaceObject.id);
    }
    
    // Basic validations
    if (!spaceObject.id) {
      console.warn('Space object missing ID, generating a fallback ID');
      spaceObject.id = `generated-${index}-${Date.now()}`;
    }
    
    // Determine node type
    const nodeType = spaceObject.space_type || spaceObject.type || 'room';
    
    // Background color based on type
    let backgroundColor = '#e2e8f0'; // Default light gray
    switch (nodeType) {
      case 'room':
        backgroundColor = '#e2e8f0';
        break;
      case 'hallway':
        backgroundColor = '#e5e7eb';
        break;
      case 'door':
        backgroundColor = '#94a3b8';
        break;
    }
    
    // Extract rotation
    const rotation = parseFloat(spaceObject?.rotation || 0);
    
    // Create and return the node
    return {
      id: spaceObject.id,
      type: nodeType,
      position: { x, y },
      data: {
        label: spaceObject.name || spaceObject.room_number || 'Unnamed',
        type: nodeType, // Added the missing 'type' property
        size: {
          width: !isNaN(width) ? width : 100,
          height: !isNaN(height) ? height : 100,
        },
        style: {
          backgroundColor,
          border: nodeType === 'door' ? '2px solid #475569' : '1px solid #cbd5e1',
        },
        properties: properties,
        rotation: !isNaN(rotation) ? rotation : 0
      }
    };
  } catch (error) {
    console.error('Error transforming space object to node:', error, spaceObject);
    
    // Return a fallback node rather than throwing
    return {
      id: spaceObject?.id || `error-${index}`,
      type: 'room',
      position: { x: index * 100, y: 0 },
      data: {
        label: 'Error Node',
        type: 'room', // Added the missing 'type' property
        size: { width: 100, height: 100 },
        style: { backgroundColor: '#ffcccc', border: '1px solid #ff0000' },
        properties: {},
        rotation: 0
      }
    };
  }
}

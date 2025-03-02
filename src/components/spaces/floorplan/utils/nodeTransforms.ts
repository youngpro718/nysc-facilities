
import { FloorPlanNode, ROOM_COLORS } from "../types/floorPlanTypes";

export function getSpaceColor(space: any): string {
  if (!space) return '#e2e8f0'; // Default color for undefined spaces
  
  if (space.object_type === 'room') {
    const baseColor = ROOM_COLORS[space.type] || ROOM_COLORS.default;
    return space.status === 'active' ? baseColor : `${baseColor}80`;
  } else if (space.object_type === 'hallway') {
    return space.status === 'active' ? '#e5e7eb' : '#e5e7eb80';
  } else {
    return space.status === 'active' ? '#94a3b8' : '#94a3b880';
  }
}

export function transformSpaceToNode(space: any, index: number): FloorPlanNode {
  // Validate space object
  if (!space || typeof space !== 'object') {
    console.warn('Invalid space object:', space);
    // Return a fallback node to prevent crashes
    return {
      id: `fallback-${index}`,
      type: 'room',
      position: { x: index * 100, y: index * 100 },
      data: {
        label: 'Error: Invalid Data',
        type: 'room',
        size: { width: 150, height: 100 },
        style: {
          backgroundColor: '#f87171',
          border: '1px dashed #ef4444',
          opacity: 0.7
        },
        properties: {}
      },
      zIndex: 0
    };
  }

  // Calculate default position with more spacing
  const defaultPosition = {
    x: (index % 3) * 300 + 100,  // Increased spacing
    y: Math.floor(index / 3) * 200 + 100  // Increased spacing
  };

  // Parse position from space object
  let spacePosition;
  try {
    spacePosition = space.position ? 
      (typeof space.position === 'string' ? JSON.parse(space.position) : space.position) :
      null;
    
    // Validate position values
    if (!spacePosition || 
        typeof spacePosition.x !== 'number' || 
        typeof spacePosition.y !== 'number' ||
        isNaN(spacePosition.x) || 
        isNaN(spacePosition.y)) {
      spacePosition = defaultPosition;
    }
  } catch (error) {
    console.warn('Error parsing position:', error);
    spacePosition = defaultPosition;
  }

  // Calculate size with better defaults
  const defaultSize = space.object_type === 'hallway' ? 
    { width: 300, height: 50 } :
    space.object_type === 'door' ?
    { width: 40, height: 10 } :
    { width: 150, height: 100 };

  let spaceSize;
  try {
    spaceSize = space.size ?
      (typeof space.size === 'string' ? JSON.parse(space.size) : space.size) :
      defaultSize;
    
    // Validate size values
    if (!spaceSize || 
        typeof spaceSize.width !== 'number' || 
        typeof spaceSize.height !== 'number' ||
        isNaN(spaceSize.width) || 
        isNaN(spaceSize.height)) {
      spaceSize = defaultSize;
    }
  } catch (error) {
    console.warn('Error parsing size:', error);
    spaceSize = defaultSize;
  }

  // Ensure space.object_type is a string
  const objectType = typeof space.object_type === 'string' ? space.object_type : 'room';
  
  const backgroundColor = getSpaceColor(space);

  // Initialize properties object with safe defaults
  const properties = {
    room_number: space.room_number || '',
    space_type: space.type || 'default',
    status: space.status || 'active',
    parent_room_id: space.parent_room_id || null,
    connection_data: space.connection_data || null
  };

  // Handle hallway connections safely
  if (Array.isArray(space.connections) && space.connections.length > 0) {
    const hallwayConnection = space.connections.find((conn: any) => 
      conn && typeof conn === 'object' && 
      (conn.direction === 'left_of_hallway' || conn.direction === 'right_of_hallway')
    );

    if (hallwayConnection) {
      const offset = hallwayConnection.offset_distance || 50;
      const alongHallway = (hallwayConnection.hallway_position || 0.5) * 1000;
      
      // Adjust position based on hallway connection
      if (hallwayConnection.direction === 'left_of_hallway') {
        spacePosition.x = alongHallway - offset - spaceSize.width;
      } else {
        spacePosition.x = alongHallway + offset;
      }
    }
  }

  return {
    id: space.id || `generated-${index}`,
    type: objectType,
    position: spacePosition,
    data: {
      label: space.name || `Space ${index}`,
      type: objectType,
      size: spaceSize,
      style: {
        backgroundColor,
        border: space.status === 'active' ? '1px solid #cbd5e1' : '2px dashed #ef4444',
        opacity: space.status === 'active' ? 1 : 0.7
      },
      properties
    },
    zIndex: objectType === 'door' ? 2 : objectType === 'hallway' ? 1 : 0
  };
}

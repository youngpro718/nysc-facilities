import { FloorPlanNode, ROOM_COLORS } from "../types/floorPlanTypes";

export function getSpaceColor(space: any): string {
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

  const backgroundColor = getSpaceColor(space);

  // Handle hallway connections
  if (space.connections?.length > 0) {
    const hallwayConnection = space.connections.find((conn: any) => 
      conn.direction === 'left_of_hallway' || conn.direction === 'right_of_hallway'
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

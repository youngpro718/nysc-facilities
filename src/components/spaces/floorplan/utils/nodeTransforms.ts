import { FloorPlanNode, ROOM_COLORS } from "../types/floorPlanTypes";

export function getSpaceColor(space: any): string {
  if (!space) return '#e2e8f0'; // Default color for undefined spaces
  
  if (space.object_type === 'room' || space.type === 'room') {
    const baseColor = ROOM_COLORS[space.type] || ROOM_COLORS.default;
    return space.status === 'active' ? baseColor : `${baseColor}80`;
  } else if (space.object_type === 'hallway' || space.type === 'hallway') {
    // Different color based on hallway type
    const hallwayType = space.properties?.hallwayType || 
                       space.properties?.type || 
                       'public_main';
    
    if (hallwayType === 'private' || 
        space.properties?.accessibility === 'restricted') {
      return space.status === 'active' ? '#f3f4f6' : '#f3f4f680'; // Lighter gray for private hallways
    }
    return space.status === 'active' ? '#e5e7eb' : '#e5e7eb80'; // Default hallway color
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

  // Calculate default position with proper grid spacing to avoid overlaps
  // Use a 4-column grid with generous spacing
  const GRID_COLS = 4;
  const CELL_WIDTH = 220;  // Room width (150) + spacing (70)
  const CELL_HEIGHT = 180; // Room height (100) + spacing (80)
  const START_OFFSET = 100;
  
  const defaultPosition = {
    x: (index % GRID_COLS) * CELL_WIDTH + START_OFFSET,
    y: Math.floor(index / GRID_COLS) * CELL_HEIGHT + START_OFFSET
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

  // Determine space type - check both object_type and type field
  const spaceType = space.object_type || space.type || 'room';

  // Set default size based on type
  const defaultSize = 
    spaceType === 'hallway' ? { width: 300, height: 50 } :
    spaceType === 'door' ? { width: 40, height: 10 } :
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

  // Ensure we have a valid type
  const objectType = typeof spaceType === 'string' ? spaceType : 'room';
  
  const backgroundColor = getSpaceColor({...space, type: objectType});

  // Ensure properties is a valid object
  const spaceProperties = typeof space.properties === 'object' && space.properties !== null ? 
    space.properties : {};

  // Merge properties from different possible sources for hallways
  const properties = {
    ...spaceProperties,
    room_number: space.room_number || '',
    space_type: space.type || spaceType || 'default',
    status: space.status || 'active',
    parent_room_id: space.parent_room_id || null,
    connection_data: space.connection_data || null,
    // For hallways, include specific properties from hallway_properties if available
    ...(objectType === 'hallway' ? {
      section: (space.hallway_properties?.[0]?.section) || 
               spaceProperties.section || 
               'connector',
      traffic_flow: (space.hallway_properties?.[0]?.traffic_flow) || 
                    spaceProperties.traffic_flow || 
                    spaceProperties.trafficFlow || 
                    'two_way',
      accessibility: (space.hallway_properties?.[0]?.accessibility) || 
                     spaceProperties.accessibility || 
                     'fully_accessible',
      emergency_route: (space.hallway_properties?.[0]?.emergency_route) || 
                       spaceProperties.emergency_route || 
                       spaceProperties.emergencyRoute || 
                       'not_designated',
      hallway_type: spaceProperties.hallwayType || 'public_main'
    } : {})
  };

  // Handle hallway connections for positioning
  if (objectType === 'hallway' && Array.isArray(space.connections) && space.connections.length > 0) {
    // Look for connected spaces
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

  // Extract rotation from data or direct property
  const rotation = space.data?.rotation !== undefined ? 
    space.data.rotation : 
    (space.rotation !== undefined ? 
      space.rotation : 
      0);

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
      properties,
      rotation
    },
    zIndex: objectType === 'door' ? 2 : objectType === 'hallway' ? 1 : 0
  };
}

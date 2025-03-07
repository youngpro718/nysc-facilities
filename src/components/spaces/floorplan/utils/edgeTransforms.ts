
import { FloorPlanEdge } from "../types/floorPlanTypes";

export function createEdgesFromConnections(connections: any[]): FloorPlanEdge[] {
  return connections.map(conn => {
    // Determine connection types and properties
    const isHallwayConnection = conn.space_type === 'hallway' || 
                              conn.to_space?.type === 'hallway' ||
                              ['start', 'end', 'left', 'right', 'center'].includes(conn.direction);
    
    // Get positioning data based on hallway position
    let hallwayPosition = conn.hallway_position || 0.5; // Default to middle
    
    // Adjust position based on the direction values
    if (conn.direction === 'start') {
      hallwayPosition = 0.1; // Near the start
    } else if (conn.direction === 'end') {
      hallwayPosition = 0.9; // Near the end
    } else if (conn.direction === 'center') {
      hallwayPosition = 0.5; // In the middle
    } else if (conn.direction === 'left') {
      hallwayPosition = 0.3; // Left side
    } else if (conn.direction === 'right') {
      hallwayPosition = 0.7; // Right side
    }
    
    const offsetDistance = conn.offset_distance || 50;   // Default offset
    
    // Determine edge type and style based on connection type
    const isTransitionDoor = conn.is_transition_door || conn.connection_type === 'transition';
    const isSecured = conn.connection_type === 'secured';
    const edgeType = isHallwayConnection ? 'straight' : 'smoothstep';
    
    // Enhanced styling based on connection type and status
    let strokeColor;
    if (conn.status === 'active') {
      if (conn.connection_type === 'door') {
        strokeColor = '#64748b'; // Standard door color
      } else if (isSecured) {
        strokeColor = '#ef4444'; // Red for secured/restricted access
      } else if (isTransitionDoor) {
        strokeColor = '#3b82f6'; // Blue for transition points
      } else {
        strokeColor = '#94a3b8'; // Default connection color
      }
    } else {
      strokeColor = '#94a3b8'; // Inactive connections
    }
    
    const strokeWidth = isHallwayConnection ? 3 : 2;
    const strokeDasharray = conn.status === 'active' ? '' : '5,5';
    const animated = conn.connection_type === 'door' || conn.connection_type === 'transition';
    
    return {
      id: conn.id,
      source: conn.from_space_id,
      target: conn.to_space_id,
      data: {
        type: conn.connection_type,
        direction: conn.direction,
        isTransitionDoor: isTransitionDoor,
        isSecured: isSecured,
        hallwayPosition: hallwayPosition,
        offsetDistance: offsetDistance,
        position: conn.position,
        style: {
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDasharray: strokeDasharray
        }
      },
      type: edgeType,
      animated: animated
    };
  });
}


import { FloorPlanEdge } from "../types/floorPlanTypes";

export function createEdgesFromConnections(connections: any[]): FloorPlanEdge[] {
  return connections.map(conn => {
    // Determine if this is a hallway connection
    const isHallwayConnection = conn.space_type === 'hallway' || 
                              conn.to_space?.type === 'hallway' ||
                              ['east', 'west', 'north', 'south', 'center'].includes(conn.direction);
    
    // Get positioning data based on hallway position
    let hallwayPosition = conn.hallway_position || 0.5; // Default to middle
    
    // Adjust position based on the new direction values
    if (conn.direction === 'north') {
      hallwayPosition = 0.1; // Near the start
    } else if (conn.direction === 'south') {
      hallwayPosition = 0.9; // Near the end
    } else if (conn.direction === 'center') {
      hallwayPosition = 0.5; // In the middle
    } else if (conn.direction === 'west') {
      hallwayPosition = 0.3; // Left side
    } else if (conn.direction === 'east') {
      hallwayPosition = 0.7; // Right side
    }
    
    const offsetDistance = conn.offset_distance || 50;   // Default offset
    
    // Determine edge type and style based on connection type
    const isTransitionDoor = conn.is_transition_door || conn.connection_type === 'transition';
    const edgeType = isHallwayConnection ? 'straight' : 'smoothstep';
    
    // Set style based on type and status
    const strokeColor = conn.status === 'active' ? 
                      (conn.connection_type === 'door' ? '#64748b' : 
                      conn.connection_type === 'secured' ? '#ef4444' : 
                      conn.connection_type === 'transition' ? '#3b82f6' : '#94a3b8') : 
                      '#94a3b8';
    
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


import { FloorPlanEdge } from "../types/floorPlanTypes";

export function createEdgesFromConnections(connections: any[]): FloorPlanEdge[] {
  return connections.map(conn => {
    // Determine if this is a hallway-specific connection
    const isHallwayConnection = conn.space_type === 'hallway' || 
                               conn.direction === 'left_of_hallway' || 
                               conn.direction === 'right_of_hallway';
    
    // Get positioning data
    const hallwayPosition = conn.hallway_position || 0.5; // Default to middle
    const offsetDistance = conn.offset_distance || 50;   // Default offset
    
    // Determine edge type and style based on connection type
    const edgeType = isHallwayConnection ? 'straight' : 'smoothstep';
    
    // Set style based on type and status
    const strokeColor = conn.status === 'active' ? 
                      (conn.connection_type === 'door' ? '#64748b' : '#94a3b8') : 
                      '#94a3b8';
    
    const strokeWidth = isHallwayConnection ? 3 : 2;
    const strokeDasharray = conn.status === 'active' ? '' : '5,5';
    const animated = conn.connection_type === 'door';
    
    return {
      id: conn.id,
      source: conn.from_space_id,
      target: conn.to_space_id,
      data: {
        type: conn.connection_type,
        direction: conn.direction,
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

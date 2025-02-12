
import { FloorPlanEdge } from "../types/floorPlanTypes";

export function createEdgesFromConnections(connections: any[]): FloorPlanEdge[] {
  return connections.map(conn => {
    const isHallwayConnection = conn.direction === 'left_of_hallway' || conn.direction === 'right_of_hallway';
    
    return {
      id: conn.id,
      source: conn.from_space_id,
      target: conn.to_space_id,
      data: {
        type: conn.connection_type,
        direction: conn.direction,
        hallwayPosition: conn.hallway_position,
        offsetDistance: conn.offset_distance,
        style: {
          stroke: conn.status === 'active' ? '#64748b' : '#94a3b8',
          strokeWidth: isHallwayConnection ? 3 : 2,
          strokeDasharray: conn.status === 'active' ? '' : '5,5'
        }
      },
      type: isHallwayConnection ? 'straight' : 'smoothstep',
      animated: conn.connection_type === 'door'
    };
  });
}

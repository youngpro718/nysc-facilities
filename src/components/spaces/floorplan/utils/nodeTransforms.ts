
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
  const defaultPosition = {
    x: (index % 3) * 200 + 50,
    y: Math.floor(index / 3) * 150 + 50
  };

  let spacePosition = space.position ? 
    (typeof space.position === 'string' ? JSON.parse(space.position) : space.position) :
    defaultPosition;

  // Ensure position has valid x and y coordinates
  if (!spacePosition || typeof spacePosition.x !== 'number' || typeof spacePosition.y !== 'number') {
    spacePosition = defaultPosition;
  }

  const defaultSize = space.object_type === 'hallway' ? 
    { width: 300, height: 50 } :
    space.object_type === 'door' ?
    { width: 40, height: 10 } :
    { width: 150, height: 100 };

  const spaceSize = space.size ?
    (typeof space.size === 'string' ? JSON.parse(space.size) : space.size) :
    defaultSize;

  const backgroundColor = getSpaceColor(space);

  if (space.connections?.length > 0) {
    const hallwayConnection = space.connections.find((conn: any) => 
      conn.direction === 'left_of_hallway' || conn.direction === 'right_of_hallway'
    );

    if (hallwayConnection) {
      const basePosition = spacePosition;
      const offset = hallwayConnection.offset_distance || 50;
      const alongHallway = (hallwayConnection.hallway_position || 0.5) * 1000;

      spacePosition = {
        x: basePosition.x + (hallwayConnection.direction === 'left_of_hallway' ? -offset : offset),
        y: basePosition.y + alongHallway
      };
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

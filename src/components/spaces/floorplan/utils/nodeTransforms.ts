
import { ROOM_COLORS } from '../types/floorPlanTypes';
import type { FloorPlanNode, FloorPlanObjectType, Size, Position } from '../types/floorPlanTypes';

export function getSpaceColor(type: string, subtype?: string): string {
  if (subtype) {
    return ROOM_COLORS[subtype as keyof typeof ROOM_COLORS] || ROOM_COLORS.default;
  }
  
  return ROOM_COLORS[type as keyof typeof ROOM_COLORS] || ROOM_COLORS.default;
}

export function transformSpace(space: any): FloorPlanNode {
  const type: FloorPlanObjectType = space.type || 'room';
  const position: Position = space.position || { x: 0, y: 0 };
  const size: Size = space.size || { 
    width: type === 'door' ? 60 : 150, 
    height: type === 'door' ? 20 : 100 
  };
  
  const spaceColor = getSpaceColor(type, space.room_type);
  
  return {
    id: space.id,
    type,
    position,
    data: {
      label: space.name || (space.room_number ? `Room ${space.room_number}` : 'Untitled Space'),
      type,
      size,
      style: {
        backgroundColor: spaceColor,
        border: type === 'door' ? '2px solid #475569' : '1px solid #cbd5e1'
      },
      properties: {
        ...space.properties,
        roomNumber: space.room_number,
        status: space.status
      },
      rotation: space.rotation || 0
    },
    rotation: space.rotation || 0,
    zIndex: type === 'door' ? 20 : (type === 'hallway' ? 10 : 0)
  };
}

export const transformSpaceToNode = transformSpace;

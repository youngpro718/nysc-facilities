
import { Node } from "reactflow";
import { ROOM_COLORS, FloorPlanObjectData, FloorPlanObjectType } from "../types/floorPlanTypes";

interface RawFloorPlanObject {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number;
  label?: string;
  properties?: Record<string, any>;
  style?: Record<string, any>;
}

export function transformFloorPlanObject(obj: RawFloorPlanObject): Node<FloorPlanObjectData> {
  const { id, type, position, size, rotation = 0, label, properties = {}, style = {} } = obj;

  // Determine style based on type
  let nodeStyle = { ...style };
  
  if (type === FloorPlanObjectType.ROOM) {
    const roomType = (properties?.roomType || 'default').toLowerCase();
    const backgroundColor = ROOM_COLORS[roomType as keyof typeof ROOM_COLORS] || ROOM_COLORS.default;
    
    nodeStyle = {
      ...nodeStyle,
      backgroundColor,
      border: '1px solid #cbd5e1',
    };
  } else if (type === FloorPlanObjectType.HALLWAY) {
    nodeStyle = {
      ...nodeStyle,
      backgroundColor: '#f1f5f9',
      border: '1px solid #cbd5e1',
    };
  } else if (type === FloorPlanObjectType.DOOR) {
    nodeStyle = {
      ...nodeStyle,
      backgroundColor: '#94a3b8',
      border: '2px solid #475569',
    };
  }

  return {
    id,
    type,
    position,
    data: {
      label: label || '',
      type,
      properties,
      size,
      style: nodeStyle,
      rotation,
    },
    width: size.width,
    height: size.height,
  };
}

export function getNodeLabel(data: FloorPlanObjectData): string {
  if (data.label) return data.label;
  
  if (data.type === FloorPlanObjectType.ROOM) {
    return data.properties?.roomNumber 
      ? `Room ${data.properties.roomNumber}`
      : 'Room';
  }
  
  if (data.type === FloorPlanObjectType.HALLWAY) {
    return 'Hallway';
  }
  
  if (data.type === FloorPlanObjectType.DOOR) {
    return 'Door';
  }
  
  return data.type || 'Unknown';
}

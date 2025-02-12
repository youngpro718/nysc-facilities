import { FloorPlanNode, FloorPlanObjectData, Position, Size } from "../types/floorPlanTypes";
import { Json } from "@/integrations/supabase/types";

const ROOM_COLORS = {
  office: '#e2e8f0',
  courtroom: '#dbeafe',
  storage: '#f1f5f9',
  default: '#f8fafc'
} as const;

function parseJsonField<T>(field: Json | null | undefined, defaultValue: T): T {
  if (!field) return defaultValue;
  try {
    return typeof field === 'string' ? JSON.parse(field) : field as T;
  } catch (error) {
    console.warn('Error parsing JSON field:', error);
    return defaultValue;
  }
}

export function getSpaceColor(type: string, status: string = 'active'): string {
  const baseColor = ROOM_COLORS[type as keyof typeof ROOM_COLORS] || ROOM_COLORS.default;
  return status === 'active' ? baseColor : `${baseColor}80`;
}

export function transformSpaceToNode(space: any, index: number): FloorPlanNode {
  // Calculate default position with more spacing
  const defaultPosition: Position = {
    x: (index % 3) * 300 + 100,
    y: Math.floor(index / 3) * 200 + 100
  };

  // Calculate default size based on type
  const defaultSize: Size = space.object_type === 'hallway' 
    ? { width: 300, height: 50 }
    : { width: 150, height: 100 };

  // Parse position and size
  const position = parseJsonField<Position>(space.position, defaultPosition);
  const size = parseJsonField<Size>(space.size, defaultSize);
  const rotation = parseJsonField<number>(space.rotation, 0);

  // Create node data
  const data: FloorPlanObjectData = {
    label: space.name || space.current_function || 'Untitled',
    type: space.object_type || 'room',
    size,
    style: {
      backgroundColor: getSpaceColor(space.type || 'default', space.status),
      opacity: space.status === 'active' ? 1 : 0.5
    },
    properties: {
      room_number: space.room_number,
      room_type: space.current_function,
      status: space.status
    },
    rotation
  };

  return {
    id: space.id,
    type: space.object_type || 'room',
    position,
    data,
    rotation,
    zIndex: space.object_type === 'hallway' ? 0 : 1
  };
}

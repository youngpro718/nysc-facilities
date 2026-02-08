
export type LayerType = 'rooms' | 'doors' | 'grid' | 'hallways' | 'annotations';

export type SpaceType = 'room' | 'door' | 'hallway' | 'annotation';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface FloorPlanObjectData {
  label?: string;
  type: string;
  size: Size;
  style: Record<string, unknown>;
  properties: Record<string, unknown>;
  position?: Position;
  rotation?: number;
}

export interface FloorPlanNode {
  id: string;
  type: string;
  position: Position;
  data: FloorPlanObjectData;
  rotation?: number;
  zIndex?: number;
}

export interface FloorPlanEdge {
  id: string;
  source: string;
  target: string;
  data?: {
    type: string;
    style?: Record<string, unknown>;
  };
}

export interface FloorPlanLayerDB {
  id: string;
  floor_id: string;
  type: LayerType;
  name: string;
  order_index: number;
  visible: boolean;
  data: unknown;
  created_at: string;
  updated_at: string;
}

export interface FloorPlanLayer {
  id: string;
  floor_id: string;
  type: LayerType;
  name: string;
  order_index: number;
  visible: boolean;
  data: Record<string, unknown>;
}

// Raw object structure from API - made all properties optional except id
export interface RawFloorPlanObject {
  id: string;
  name?: string;
  room_number?: string;
  type?: string;
  object_type?: string;
  room_type?: string;
  status?: string;
  floor_id?: string;
  position?: Position | string | any; // Allow any for parsing flexibility
  size?: Size | string | any; // Allow any for parsing flexibility
  rotation?: number; 
  properties?: Record<string, unknown> | null;
  parent_room_id?: string | null;
  hallway_properties?: unknown[];
}

// 3D visualization specific types
export interface Object3D {
  id: string;
  type: string;
  position: Position;
  size: Size;
  rotation?: number;
  color?: string;
  properties?: Record<string, unknown>;
}

export interface Connection3D {
  id: string;
  source: string;
  target: string;
  type: string;
}

export const ROOM_COLORS: Record<string, string> = {
  office: '#e2e8f0',
  courtroom: '#dbeafe',
  storage: '#f1f5f9',
  conference: '#fef3c7',
  default: '#e2e8f0'
};

export const GRID_SIZE = 20;
export const MIN_ROOM_SIZE = { width: 100, height: 100 };

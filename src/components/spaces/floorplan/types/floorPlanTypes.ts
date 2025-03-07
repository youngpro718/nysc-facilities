
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
  style: Record<string, any>;
  properties: Record<string, any>;
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
  type?: string;
  animated?: boolean;
  data?: {
    type?: string;
    direction?: string;
    isTransitionDoor?: boolean;
    hallwayPosition?: number;
    offsetDistance?: number;
    position?: any;
    style?: {
      stroke?: string;
      strokeWidth?: number;
      strokeDasharray?: string;
    };
  };
}

export interface FloorPlanLayerDB {
  id: string;
  floor_id: string;
  type: LayerType;
  name: string;
  order_index: number;
  visible: boolean;
  data: any;
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
  data: Record<string, any>;
}

export interface FloorPlanConnectionData {
  id: string;
  from_space_id: string;
  to_space_id: string;
  connection_type: string;
  status: string;
  direction?: string;
  space_type?: string;
  hallway_position?: number;
  offset_distance?: number;
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

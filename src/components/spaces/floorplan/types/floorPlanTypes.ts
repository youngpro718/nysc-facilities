
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
  data?: {
    type: string;
    direction?: string;
    isTransitionDoor?: boolean;
    isSecured?: boolean;
    hallwayPosition?: number;
    offsetDistance?: number;
    position?: string;
    style?: Record<string, any>;
  };
  type?: string;
  animated?: boolean;
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

export const ROOM_COLORS: Record<string, string> = {
  office: '#e2e8f0',
  courtroom: '#D3E4FD',  // Light blue for public rooms
  hearing_room: '#D3E4FD',
  storage: '#f1f5f9',
  conference: '#fef3c7',
  private: '#E5DEFF',    // Muted purple for private/admin rooms
  default: '#e2e8f0'
};

export const GRID_SIZE = 20;
export const MIN_ROOM_SIZE = { width: 100, height: 100 };

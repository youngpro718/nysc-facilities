
// Basic types for floor plan objects
export type Position = { x: number; y: number };
export type Size = { width: number; height: number };
export type Style = Record<string, string | number>;

export enum FloorPlanObjectType {
  ROOM = "room",
  HALLWAY = "hallway",
  DOOR = "door",
  WALL = "wall",
  WINDOW = "window",
  STAIR = "stair",
  ELEVATOR = "elevator",
  FURNITURE = "furniture",
  TEXT = "text"
}

export enum LayerType {
  BASE = "base",
  WALLS = "walls",
  ROOMS = "rooms",
  FURNITURE = "furniture",
  ANNOTATIONS = "annotations",
  MEASUREMENTS = "measurements"
}

export interface FloorPlanNodeData {
  label?: string;
  type: FloorPlanObjectType | string;
  size?: Size;
  style?: Style;
  properties?: Record<string, any>;
  rotation?: number;
}

export interface FloorPlanNode {
  id: string;
  type: FloorPlanObjectType | string;
  position: Position;
  data: FloorPlanNodeData;
  rotation?: number;
  zIndex?: number;
}

export interface FloorPlanEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: Record<string, any>;
}

export interface FloorPlanLayerBase {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  order_index: number;
  data?: Record<string, any>;
}

export interface FloorPlanLayerDB extends FloorPlanLayerBase {
  floor_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface FloorPlanLayer extends FloorPlanLayerBase {
  floorId: string;
  createdAt?: string;
  updatedAt?: string;
}

// Define object colors
export const COLORS = {
  ROOM: {
    DEFAULT: '#e2e8f0', // slate-200
    SELECTED: '#cbd5e1', // slate-300
    HOVER: '#f8fafc', // slate-50
  },
  HALLWAY: {
    DEFAULT: '#f1f5f9', // slate-100
    SELECTED: '#e2e8f0', // slate-200
    HOVER: '#f8fafc', // slate-50
  },
  DOOR: {
    DEFAULT: '#94a3b8', // slate-400
    SELECTED: '#64748b', // slate-500
    HOVER: '#cbd5e1', // slate-300
  },
  WALL: {
    DEFAULT: '#475569', // slate-600
    SELECTED: '#334155', // slate-700
    HOVER: '#64748b', // slate-500
  }
};

// Special type for React Flow onConnect handler
export interface Connection {
  source: string | null;
  target: string | null;
  sourceHandle: string | null;
  targetHandle: string | null;
}

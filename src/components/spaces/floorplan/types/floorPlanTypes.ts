
import { Node, Edge } from 'reactflow';

export type Position = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type FloorPlanLayerType = 'image' | 'grid' | 'annotations' | 'spaces' | 'furniture';

export interface FloorPlanLayer {
  id: string;
  floorId: string;
  type: FloorPlanLayerType;
  name: string;
  orderIndex: number;
  visible: boolean;
  data: Record<string, any>;
}

// Interface for database representation
export interface FloorPlanLayerDB {
  id: string;
  floor_id: string;
  type: FloorPlanLayerType;
  name: string;
  order_index: number;
  visible: boolean;
  data: Record<string, any>;
}

export interface FloorPlanObjectType {
  id: string;
  type: 'room' | 'hallway' | 'door' | 'furniture';
  position: Position;
  size: Size;
  rotation?: number;
  label?: string;
  properties?: Record<string, any>;
  style?: Record<string, any>;
  zIndex?: number;
}

export type FloorPlanObjectData = {
  label: string;
  type: string;
  size: Size;
  style: Record<string, any>;
  properties: Record<string, any>;
  rotation?: number;
};

export type FloorPlanNode = Node<FloorPlanObjectData>;
export type FloorPlanEdge = Edge;
export type RawFloorPlanObject = FloorPlanObjectType & Record<string, any>;

export const ROOM_COLORS = {
  default: '#e2e8f0',
  active: '#bfdbfe',
  inactive: '#f1f5f9',
  under_maintenance: '#fde68a',
  selected: '#93c5fd',
};

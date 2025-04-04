
import { Node, Edge } from 'reactflow';

// Room color definitions
export const ROOM_COLORS = {
  classroom: '#e2e8f0',
  office: '#dbeafe',
  meeting: '#fae8ff',
  storage: '#f5f5f4',
  restroom: '#dcfce7',
  courtroom: '#fef9c3',
  lobby: '#f3e8ff',
  default: '#e2e8f0'
};

export interface FloorPlanObjectData {
  label: string;
  type: string;
  size: {
    width: number;
    height: number;
  };
  style: {
    backgroundColor: string;
    border: string;
    [key: string]: any;
  };
  properties: {
    [key: string]: any;
  };
  rotation: number;
  [key: string]: any;
}

export interface FloorPlanNode extends Node {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: FloorPlanObjectData;
  rotation?: number;
  zIndex?: number;
}

export interface FloorPlanEdge extends Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  style?: object;
}

export interface FloorPlanLayerDB {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  order_index: number;
  floor_id: string;
  data: Record<string, any>;
}

export interface FloorPlanLayer {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  order_index: number;
  floor_id: string;
  data: Record<string, any>;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface RawFloorPlanObject {
  id: string;
  type: string;
  position: Position;
  size: Size;
  properties?: Record<string, any>;
  object_type?: string;
  rotation: number;
  [key: string]: any;
}

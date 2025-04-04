
import { Node, Edge } from 'reactflow';

export interface FloorPlanNode extends Node {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: {
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
  };
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
  floorId: string;
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

// Define room colors for different space types
export const ROOM_COLORS = {
  'courtroom': '#c1e1c1',        // Light green
  'judges_chambers': '#c7d5ed',  // Light blue
  'office': '#e5e1c1',           // Light tan
  'conference': '#d5c1e1',       // Light purple
  'storage': '#e1c1c7',          // Light pink
  'utility': '#c1e1e5',          // Light cyan
  'reception': '#e1d5c1',        // Light brown
  'restroom': '#c1c7e1',         // Light lavender
  'security': '#e1c1a0',         // Light orange
  'default': '#e2e8f0'           // Default gray
};

export type FloorPlanObjectType = "room" | "hallway" | "door" | "furniture" | "annotation";

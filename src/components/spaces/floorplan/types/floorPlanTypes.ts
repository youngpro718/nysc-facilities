
import { Json } from "@/integrations/supabase/types";
import { Node } from "reactflow";

export type LayerType = 'rooms' | 'doors' | 'grid' | 'hallways' | 'annotations';

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
  type: FloorPlanObjectType;
  size: Size;
  style: Record<string, any>;
  properties: Record<string, any>;
}

export type FloorPlanObjectType = 'room' | 'door' | 'hallway';

// Base object from database
export interface FloorPlanObject {
  id: string;
  floor_id: string;
  type: FloorPlanObjectType;
  label?: string;
  position: Json;
  size: Json;
  style: Json;
  properties: Json;
  rotation?: number;
  z_index?: number;
}

// Node type for React Flow
export type FloorPlanNode = Node<FloorPlanObjectData>;

export interface FloorPlanEdge {
  id: string;
  source: string;
  target: string;
  data?: {
    type: string;
    style?: Record<string, any>;
  };
}

export interface FloorPlanLayerDB {
  id: string;
  floor_id: string;
  type: LayerType;
  name: string;
  order_index: number;
  visible: boolean;
  data: Json;
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
  courtroom: '#dbeafe',
  storage: '#f1f5f9',
  conference: '#fef3c7',
  default: '#e2e8f0'
};

export const GRID_SIZE = 20;
export const MIN_ROOM_SIZE = { width: 100, height: 100 };

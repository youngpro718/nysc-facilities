
import { Json } from "@/integrations/supabase/types";

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
  type: string;
  size: Size;
  style: Record<string, any>;
  properties: Record<string, any>;
}

// Instead of extending Node and Edge directly, we define our own interfaces
export interface FloorPlanNode {
  id: string;
  type: string;
  position: Position;
  data: FloorPlanObjectData;
  zIndex?: number;
}

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

export type DrawingMode = 'view' | 'draw' | 'door' | 'hallway';

export const ROOM_COLORS: Record<string, string> = {
  office: '#e2e8f0',
  courtroom: '#dbeafe',
  storage: '#f1f5f9',
  conference: '#fef3c7',
  default: '#e2e8f0'
};

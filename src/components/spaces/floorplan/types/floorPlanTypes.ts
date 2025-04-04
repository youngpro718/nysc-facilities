
import { Dispatch, SetStateAction } from "react";
import { Json } from "@/types/supabase";

// Define basic types
export type FloorPlanObjectType = 'room' | 'hallway' | 'door' | 'fixture' | 'connection';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface FloorPlanObjectStyle {
  backgroundColor?: string;
  border?: string;
  borderRadius?: string;
  opacity?: number;
  [key: string]: any;
}

export interface FloorPlanObjectData {
  label?: string;
  type: FloorPlanObjectType;
  size: Size;
  style?: FloorPlanObjectStyle;
  properties?: Record<string, any>;
  rotation?: number;
}

export interface FloorPlanNode {
  id: string;
  type: FloorPlanObjectType;
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
  data?: any;
}

export interface FloorPlanLayer {
  id: string;
  name: string;
  floorId: string; // Changed from floor_id
  type: 'base' | 'furniture' | 'lighting' | 'emergency' | 'custom';
  visible: boolean;
  orderIndex: number;
  data?: Record<string, any>;
}

export interface FloorPlanLayerDB {
  id: string;
  name: string;
  floor_id: string;
  type: 'base' | 'furniture' | 'lighting' | 'emergency' | 'custom';
  visible: boolean;
  order_index: number;
  data?: Record<string, any>;
}

// Define the full state type
export interface FloorPlanState {
  nodes: FloorPlanNode[];
  edges: FloorPlanEdge[];
  layers: FloorPlanLayer[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectedLayerId: string | null;
  zoomLevel: number;
  panPosition: Position;
}

// Define action-related types
export type FloorPlanAction = 
  | { type: 'SET_NODES'; payload: FloorPlanNode[] }
  | { type: 'SET_EDGES'; payload: FloorPlanEdge[] }
  | { type: 'SELECT_NODE'; payload: string | null }
  | { type: 'UPDATE_NODE'; payload: { id: string, data: Partial<FloorPlanNode> } };

// Export colors for different types of spaces
export const ROOM_COLORS = {
  default: '#e2e8f0',
  selected: '#94a3b8',
  courtroom: '#bae6fd',
  office: '#d1fae5',
  storage: '#fef3c7',
  hallway: '#f5d0fe',
  door: '#94a3b8',
};

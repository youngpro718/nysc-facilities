
import { Node, Edge } from 'reactflow';

export enum FloorPlanObjectType {
  ROOM = 'room',
  HALLWAY = 'hallway',
  DOOR = 'door',
  FURNITURE = 'furniture',
  LABEL = 'label',
  WALL = 'wall'
}

export enum FloorPlanLayerType {
  SPACES = 'spaces',
  WALLS = 'walls',
  FURNITURE = 'furniture',
  LABELS = 'labels',
  MEASUREMENTS = 'measurements',
  GRID = 'grid',
  BACKGROUND = 'background'
}

export interface FloorPlanObjectData {
  label?: string;
  type: string;
  style?: Record<string, any>;
  properties?: Record<string, any>;
  size?: { width: number; height: number };
  rotation?: number;
}

export interface FloorPlanNode extends Node<FloorPlanObjectData> {
  rotation?: number;
  zIndex?: number;
}

export interface FloorPlanEdge extends Edge {}

export interface FloorPlanLayer {
  id: string;
  floorId: string;
  type: FloorPlanLayerType;
  name: string;
  orderIndex: number;
  visible: boolean;
  data: Record<string, any>;
}

export interface FloorPlanLayerDB {
  id: string;
  floor_id: string;
  type: FloorPlanLayerType;
  name: string;
  order_index: number;
  visible: boolean;
  data: string | Record<string, any>;
}

export interface FloorPlanState {
  nodes: FloorPlanNode[];
  edges: FloorPlanEdge[];
  layers: FloorPlanLayer[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectedLayerId: string | null;
  zoomLevel: number;
  panPosition: { x: number; y: number };
}

// Room color definitions for different room types
export const ROOM_COLORS = {
  'office': '#e5f5e0',
  'conference': '#c7e9c0',
  'classroom': '#a1d99b',
  'storage': '#e6e6e6',
  'bathroom': '#c6dbef',
  'break_room': '#fdd0a2',
  'courtroom': '#fdae6b',
  'jury_room': '#9ecae1',
  'default': '#e2e8f0'
};

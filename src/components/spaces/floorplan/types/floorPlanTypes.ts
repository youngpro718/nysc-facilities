
export type LayerType = 'rooms' | 'doors' | 'grid' | 'hallways' | 'annotations';

export interface FloorPlanObject {
  id: string;
  layer_id: string;
  floor_id: string;
  label?: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  style: Record<string, any>;
  properties: Record<string, any>;
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

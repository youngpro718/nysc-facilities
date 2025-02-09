
export interface Room {
  name: string;
  room_number: string;
  room_type: string;
  status: string;
}

export interface FloorPlanObject {
  id: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  object_type: string;
  object_id: string;
  rooms?: Room | null;
  created_at?: string;
  floor_id?: string;
  metadata?: Record<string, unknown>;
  rotation?: number;
  scale_x?: number;
  scale_y?: number;
  updated_at?: string;
}

export const ROOM_COLORS: Record<string, string> = {
  office: '#e2e8f0',
  courtroom: '#dbeafe',
  storage: '#f1f5f9',
  conference: '#fef3c7',
  default: '#e2e8f0'
};

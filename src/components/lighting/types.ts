
export type LightStatus = 'functional' | 'maintenance_needed' | 'non_functional';
export type LightingType = 'standard' | 'motion_sensor';
export type LightingTechnology = 'LED' | 'Fluorescent' | 'Bulb' | null;
export type LightingPosition = 'ceiling' | 'wall' | 'floor' | 'desk' | null;

export interface MaintenanceEntry {
  id: string;
  date: string;
  type: string;
  notes: string;
}

export interface LightingFixture {
  id: string;
  name: string;
  type: LightingType;
  status: LightStatus;
  zone_name?: string | null;
  building_name: string | null;
  floor_name: string | null;
  floor_id: string | null;
  space_id?: string | null;
  space_type?: 'room' | 'hallway' | null;
  position?: LightingPosition;
  sequence_number?: number | null;
  zone_id?: string | null;
  space_name?: string | null;
  room_number?: string | null;
  technology: LightingTechnology;
  maintenance_notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface LightingZone {
  id: string;
  name: string;
  floor_id: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

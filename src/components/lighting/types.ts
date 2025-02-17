
export type LightStatus = 'functional' | 'maintenance_needed' | 'non_functional' | 'pending_maintenance' | 'scheduled_replacement';
export type LightingType = 'standard' | 'emergency' | 'motion_sensor';
export type LightingTechnology = 'LED' | 'Fluorescent' | 'Bulb' | null;
export type LightingPosition = 'ceiling' | 'wall' | 'floor' | 'desk';
export type SpaceType = 'room' | 'hallway';

export interface ElectricalIssues {
  short_circuit: boolean;
  wiring_issues: boolean;
  voltage_problems: boolean;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: string;
  notes: string;
}

export interface InspectionRecord {
  id: string;
  date: string;
  status: string;
  notes?: string;
}

export interface SpatialAssignment {
  id: string;
  sequence_number: number;
  position: string;
  space_type: SpaceType;
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
  space_type?: SpaceType;
  position?: LightingPosition;
  sequence_number?: number | null;
  zone_id?: string | null;
  space_name?: string | null;
  room_number?: string | null;
  technology: LightingTechnology;
  maintenance_notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  bulb_count: number;
  electrical_issues: ElectricalIssues;
  ballast_issue: boolean;
  ballast_check_notes?: string | null;
  emergency_circuit: boolean;
  backup_power_source?: string | null;
  emergency_duration_minutes?: number | null;
  maintenance_history?: MaintenanceRecord[];
  inspection_history?: InspectionRecord[];
  spatial_assignment?: SpatialAssignment;
}

export interface RoomLightingConfig {
  id: string;
  room_id: string;
  primary_lighting: boolean;
  emergency_lighting: boolean;
  lighting_type: LightingType;
  fixture_count: number;
  last_inspection?: string;
  emergency_circuit?: boolean;
  backup_duration_minutes?: number;
  electrical_issues?: ElectricalIssues;
  technology: LightingTechnology;
  status: LightStatus;
  position: LightingPosition;
  space_type: SpaceType;
  name: string;
  bulb_count: number;
  ballast_issue: boolean;
  ballast_check_notes?: string | null;
  maintenance_notes?: string | null;
}

export interface Space {
  id: string;
  name: string;
  type: string;
  space_type: SpaceType;
  room_number?: string;
  floor_id: string;
  status: 'active' | 'inactive' | 'under_maintenance';
  created_at: string;
  updated_at: string;
  properties?: Record<string, any>;
  position?: Record<string, any>;
  size?: Record<string, any>;
  rotation?: number;
  subtype?: string;
}

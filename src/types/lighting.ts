
export type LightStatus = 'functional' | 'non_functional' | 'maintenance_needed' | 'scheduled_replacement' | 'pending_maintenance';
export type LightingType = 'standard' | 'emergency' | 'exit_sign' | 'decorative' | 'motion_sensor';
export type LightingPosition = 'ceiling' | 'wall' | 'floor' | 'desk';
export type LightingTechnology = 'LED' | 'Fluorescent' | 'Bulb';

export interface ElectricalIssues {
  short_circuit: boolean;
  wiring_issues: boolean;
  voltage_problems: boolean;
  [key: string]: boolean;  // Add index signature to make it compatible with Json
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
  notes: string;
}

export interface SpatialAssignment {
  id: string;
  sequence_number: number;
  position: string;
  space_type: 'room' | 'hallway';
}

export interface Space {
  id: string;
  name: string;
  room_number?: string | null;
  floor_id: string;
  type: 'room' | 'hallway';
}

export interface LightingFixture {
  id: string;
  name: string;
  type: LightingType;
  status: LightStatus;
  zone_name?: string | null;
  room_number: string | null;
  space_name: string | null;
  space_id: string | null;
  space_type: 'room' | 'hallway';
  position: LightingPosition;
  sequence_number?: number | null;
  zone_id?: string | null;
  technology: LightingTechnology | null;
  bulb_count: number;
  ballast_issue: boolean;
  requires_electrician: boolean;
  reported_out_date: string | null;
  replaced_date: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Building info for display
  building_name?: string | null;
  floor_name?: string | null;
  building_id?: string;
  floor_id?: string | null;
  // Optional fields used by some UI components
  electrical_issues?: ElectricalIssues;
  last_maintenance_date?: string | null;
  next_maintenance_date?: string | null;
  installation_date?: string | null;
  emergency_circuit?: boolean;
  // Additional maintenance fields used in CardBack
  ballast_check_notes?: string | null;
  maintenance_history?: MaintenanceRecord[];
  maintenance_notes?: string | null;
  inspection_history?: InspectionRecord[];
  spatial_assignment?: SpatialAssignment;
  // Additional maintenance/inspection metadata present in DB
  maintenance_priority?: string | null;
  last_inspection_date?: string | null;
  next_inspection_date?: string | null;
  scheduled_maintenance_date?: string | null;
  maintenance_frequency_days?: number | null;
  last_scheduled_by?: string | null;
  balance_check_date?: string | null;
  qr_code_url?: string | null;
  last_scanned_at?: string | null;
  times_scanned?: number | null;
  // Computed client-side metrics
  outage_minutes?: number | null;      // if currently out (reported_out_date && !replaced_date)
  repair_minutes?: number | null;      // if repaired (reported_out_date && replaced_date)
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
  space_type: 'room' | 'hallway';
  name: string;
  bulb_count: number;
  ballast_issue: boolean;
  ballast_check_notes?: string | null;
  maintenance_notes?: string | null;
}

export interface LightingFixtureFormData {
  name: string;
  type: LightingType;
  technology: LightingTechnology | null;
  bulb_count: number;
  status: LightStatus;
  ballast_issue: boolean;
  requires_electrician: boolean;
  space_id: string;
  space_type: "room" | "hallway";
  position: LightingPosition;
  room_number?: string | null;
  notes?: string | null;
}

export interface LightingZoneFormData {
  name: string;
  type: string;
  floorId: string;
}

export interface RoomLightingStats {
  room_id: string | null;
  room_name: string | null;
  room_number: string | null;
  fixture_count: number;
  open_issues_total: number;
  open_replaceable: number;
  open_electrician: number;
  mttr_minutes: number | null;
  longest_open_minutes: number | null;
  has_sla_breach: boolean;
}

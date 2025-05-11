
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

export interface LightingFixture {
  id: string;
  name: string;
  type: LightingType;
  status: LightStatus;
  zone_name: string | null;
  building_name: string | null;
  floor_name: string | null;
  floor_id: string | null;
  space_id: string | null;
  space_type: 'room' | 'hallway';
  position: LightingPosition;
  sequence_number: number | null;
  zone_id: string | null;
  space_name: string | null;
  room_number: string | null;
  technology: LightingTechnology | null;
  maintenance_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  bulb_count: number;
  electrical_issues: ElectricalIssues;
  ballast_issue: boolean;
  ballast_check_notes: string | null;
  emergency_circuit: boolean;
  backup_power_source: string | null;
  emergency_duration_minutes: number | null;
  maintenance_history: MaintenanceRecord[];
  inspection_history: InspectionRecord[];
  spatial_assignment?: {
    id: string;
    sequence_number: number;
    position: string;
    space_type: string;
  };
  building_id?: string;
}

export interface LightingFixtureFormData {
  name: string;
  type: LightingType;
  technology: LightingTechnology | null;
  bulb_count: number;
  status: LightStatus;
  electrical_issues: ElectricalIssues;
  ballast_issue: boolean;
  maintenance_notes: string | null;
  ballast_check_notes: string | null;
  zone_id?: string | null;
  space_id: string;
  space_type: "room" | "hallway";
  position: LightingPosition;
  room_number?: string | null;
}

export interface LightingZoneFormData {
  name: string;
  type: string;
  floorId: string;
}

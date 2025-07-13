
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
  room_number: string | null;
  space_name: string | null;
  space_id: string | null;
  space_type: 'room' | 'hallway';
  position: LightingPosition;
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

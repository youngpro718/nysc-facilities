export interface Space {
  id: string;
  name: string;
  space_type: 'room' | 'hallway';
  room_number?: string | null;
}

export type LightStatus = 'functional' | 'maintenance_needed' | 'non_functional' | 'pending_maintenance' | 'scheduled_replacement';
export type LightingType = 'standard' | 'emergency' | 'motion_sensor';
export type LightingTechnology = 'LED' | 'Fluorescent' | 'Bulb' | null;
export type LightingPosition = 'ceiling' | 'wall' | 'floor' | 'desk' | 'recessed';

export interface ElectricalIssues {
  short_circuit: boolean;
  wiring_issues: boolean;
  voltage_problems: boolean;
}

export interface EnergyUsageData {
  daily_usage: any[];
  efficiency_rating: string | null;
  last_reading: string | null;
}

export interface EmergencyProtocols {
  emergency_contact: string | null;
  backup_system: boolean;
  evacuation_route: boolean;
}

export interface WarrantyInfo {
  start_date: string | null;
  end_date: string | null;
  provider: string | null;
  terms: string | null;
}

export interface ManufacturerDetails {
  name: string | null;
  model: string | null;
  serial_number: string | null;
  support_contact: string | null;
}

export interface InspectionEntry {
  date: string;
  status: string;
  notes?: string;
}

export interface MaintenanceEntry {
  date: string;
  type: string;
  notes?: string;
}

export interface SpatialAssignment {
  space_type: 'room' | 'hallway';
  position: LightingPosition;
  sequence_number: number;
}

export interface LightingCoordinates {
  x: number;
  y: number;
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
  coordinates?: LightingCoordinates | null;
  sequence_number?: number | null;
  zone_id?: string | null;
  space_name?: string | null;
  room_number?: string | null;
  emergency_circuit: boolean;
  technology: LightingTechnology;
  ballast_issue: boolean;
  bulb_count: number;
  electrical_issues: ElectricalIssues;
  energy_usage_data?: EnergyUsageData | null;
  emergency_protocols?: EmergencyProtocols | null;
  warranty_info?: WarrantyInfo | null;
  manufacturer_details?: ManufacturerDetails | null;
  inspection_history?: InspectionEntry[];
  maintenance_history?: MaintenanceEntry[];
  connected_fixtures?: string[];
  created_at?: string | null;
  updated_at?: string | null;
  maintenance_notes?: string | null;
  ballast_check_notes?: string | null;
  backup_power_source?: string | null;
  emergency_duration_minutes?: number | null;
  spatial_assignment?: SpatialAssignment | null;
}

export interface RoomLightingConfig {
  id?: string;
  room_id: string;
  name: string;
  type: LightingType;
  technology: LightingTechnology;
  bulb_count: number;
  status: LightStatus;
  maintenance_notes?: string | null;
  electrical_issues: ElectricalIssues;
  ballast_issue: boolean;
  ballast_check_notes?: string | null;
  emergency_circuit: boolean;
  position: LightingPosition;
  sequence_number?: number;
  zone_id?: string | null;
}

export interface LightingFixture {
  id: string;
  name: string;
  type: "standard" | "emergency" | "motion_sensor";
  status: "functional" | "maintenance_needed" | "non_functional" | "pending_maintenance" | "scheduled_replacement";
  zone_name?: string;
  building_name: string;
  floor_name: string;
  floor_id: string;
  maintenance_notes?: string;
  emergency_circuit: boolean;
  backup_power_source?: string | null;
  emergency_duration_minutes?: number | null;
  technology: "LED" | "Fluorescent" | "Bulb";
  energy_usage_data?: {
    daily_usage: any[];
    efficiency_rating: string | null;
    last_reading: string | null;
  } | null;
  emergency_protocols?: {
    emergency_contact: string | null;
    backup_system: boolean;
    evacuation_route: boolean;
  } | null;
  connected_fixtures?: string[];
  inspection_history?: {
    date: string;
    status: string;
    notes?: string;
  }[];
  warranty_info?: {
    start_date: string | null;
    end_date: string | null;
    provider: string | null;
    terms: string | null;
  } | null;
  manufacturer_details?: {
    name: string | null;
    model: string | null;
    serial_number: string | null;
    support_contact: string | null;
  };
  spatial_assignment?: {
    space_id: string;
    space_type: 'room' | 'hallway';
    position: string;
    sequence_number: number;
  };
  electrical_issues: {
    short_circuit: boolean;
    wiring_issues: boolean;
    voltage_problems: boolean;
  };
  ballast_issue: boolean;
  ballast_check_notes?: string;
  maintenance_history?: {
    date: string;
    type: string;
    notes?: string;
  }[];
  bulb_count: number;
  space_id?: string;
  space_type?: 'room' | 'hallway';
  position?: string;
  sequence_number?: number;
  zone_id?: string;
  space_name?: string;
  room_number?: string;
}

export interface RoomLightingConfig {
  id?: string;
  room_id?: string;
  name: string;
  zone_id?: string;
  type: "standard" | "emergency" | "motion_sensor";
  technology: "LED" | "Fluorescent" | "Bulb";
  bulb_count: number;
  status: "functional" | "maintenance_needed" | "non_functional" | "pending_maintenance" | "scheduled_replacement";
  maintenance_notes?: string;
  electrical_issues: {
    short_circuit: boolean;
    wiring_issues: boolean;
    voltage_problems: boolean;
  };
  ballast_issue: boolean;
  ballast_check_notes?: string;
  emergency_circuit: boolean;
  position?: string;
  sequence_number?: number;
}

export interface LightingZone {
  id: string;
  name: string;
  type: string;
  parent_zone_id?: string;
  zone_path?: string[];
  floor_coverage?: any;
  floor_id?: string;
  fixtures?: LightingFixture[];
}

export interface EmergencyRoute {
  id: string;
  name: string;
  floor_id: string;
  fixture_sequence: string[];
  route_type: 'primary' | 'secondary' | 'auxiliary';
  status: 'active' | 'inactive' | 'maintenance';
}

export interface SpatialAssignment {
  id: string;
  fixture_id: string;
  space_id: string;
  space_type: 'room' | 'hallway';
  position: string;
  sequence_number: number;
  zone_id?: string;
}

export interface Space {
  id: string;
  name: string;
  space_type: 'room' | 'hallway';
  room_number?: string;
  floor_id: string;
}

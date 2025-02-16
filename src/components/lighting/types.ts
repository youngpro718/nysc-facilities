
export interface Space {
  id: string;
  name: string;
  space_type: 'room' | 'hallway';
  room_number?: string | null;
}

export interface LightingFixture {
  id: string;
  name: string;
  type: "standard" | "emergency" | "motion_sensor";
  status: "functional" | "maintenance_needed" | "non_functional" | "pending_maintenance" | "scheduled_replacement";
  zone_name?: string | null;
  building_name: string | null;
  floor_name: string | null;
  floor_id: string | null;
  maintenance_notes?: string | null;
  emergency_circuit: boolean;
  backup_power_source?: string | null;
  emergency_duration_minutes?: number | null;
  technology: "LED" | "Fluorescent" | "Bulb" | null;
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
  connected_fixtures?: string[] | null;
  inspection_history?: {
    date: string;
    status: string;
    notes?: string;
  }[] | null;
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
  } | null;
  spatial_assignment?: {
    space_id: string;
    space_type: 'room' | 'hallway';
    position: string;
    sequence_number: number;
  } | null;
  electrical_issues: {
    short_circuit: boolean;
    wiring_issues: boolean;
    voltage_problems: boolean;
  };
  ballast_issue: boolean;
  ballast_check_notes?: string | null;
  maintenance_history?: {
    date: string;
    type: string;
    notes?: string;
  }[] | null;
  bulb_count: number;
  space_id?: string | null;
  space_type?: 'room' | 'hallway' | null;
  position?: 'ceiling' | 'wall' | 'floor' | 'desk' | 'recessed' | null;
  sequence_number?: number | null;
  zone_id?: string | null;
  space_name?: string | null;
  room_number?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface RoomLightingConfig {
  id?: string;
  room_id: string;
  name: string;
  type: "standard" | "emergency" | "motion_sensor";
  technology: "LED" | "Fluorescent" | "Bulb";
  bulb_count: number;
  status: "functional" | "maintenance_needed" | "non_functional" | "pending_maintenance" | "scheduled_replacement";
  electrical_issues: {
    short_circuit: boolean;
    wiring_issues: boolean;
    voltage_problems: boolean;
  };
  ballast_issue: boolean;
  emergency_circuit: boolean;
  maintenance_notes?: string;
  ballast_check_notes?: string;
  position: 'ceiling' | 'wall' | 'floor' | 'desk' | 'recessed';
  sequence_number?: number;
  zone_id?: string;
}

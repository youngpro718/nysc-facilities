
export interface HallwayConnection {
  id: string;
  position: string;
  connection_type: string;
  door_details?: Record<string, unknown>;
  access_requirements?: Record<string, unknown>;
  is_emergency_exit?: boolean;
  to_space?: {
    name: string;
  };
}

export type HallwaySection = 'main' | 'north_east' | 'north_west' | 'center_east' | 'center_west' | 'south_east' | 'south_west' | 'connector';
export type HallwayType = 'public_main' | 'private' | 'private_main';
export type HallwayStatus = 'active' | 'inactive' | 'under_maintenance';
export type TrafficFlow = 'one_way' | 'two_way' | 'restricted';
export type Accessibility = 'fully_accessible' | 'limited_access' | 'stairs_only' | 'restricted';
export type EmergencyRoute = 'primary' | 'secondary' | 'not_designated';

export interface MaintenanceSchedule {
  date: string;
  type: string;
  assigned_to?: string;
  status: string;
}

export interface UsageStatistics {
  daily_traffic: number;
  peak_hours: string[];
  last_updated: string | null;
}

export interface EmergencyExit {
  location: string;
  type: string;
  notes?: string;
}

export interface Hallway {
  id: string;
  name: string;
  type: HallwayType;
  status: HallwayStatus;
  section: HallwaySection;
  notes: string;
  description?: string;
  maintenance_status?: string;
  last_inspection_date?: string;
  floor_id: string;
  main_hallway_id?: string;
  created_at: string;
  updated_at: string;
  maintenance_history?: unknown[];
  next_maintenance_date?: string;
  last_maintenance_date?: string;
  maintenance_priority?: string;
  inspection_history?: unknown[];
  next_inspection_date?: string;
  maintenance_notes?: string;
  inspected_by?: string;
  // New fields
  capacity_limit?: number;
  traffic_flow?: TrafficFlow;
  accessibility?: Accessibility;
  emergency_route?: EmergencyRoute;
  width_meters?: number;
  length_meters?: number;
  last_inspection_notes?: string;
  emergency_exits?: EmergencyExit[];
  security_level?: string;
  maintenance_schedule?: MaintenanceSchedule[];
  usage_statistics?: UsageStatistics;
  floors?: {
    name: string;
    buildings?: {
      name: string;
    };
  };
  space_connections?: HallwayConnection[] | null;
}

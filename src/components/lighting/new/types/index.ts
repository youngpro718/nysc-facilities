export type LightingTab = 'overview' | 'fixtures' | 'rooms' | 'maintenance' | 'reports' | 'hallways' | 'status' | 'floors';

export interface LightingPageState {
  activeTab: LightingTab;
  selectedBuilding?: string;
  selectedFloor?: string;
  quickFilters: QuickFilterState;
}

export interface QuickFilterState {
  needsAttention?: boolean;
  recentlyFixed?: boolean;
  scheduledMaintenance?: boolean;
  energyEfficient?: boolean;
}

export interface MaintenanceWorkItem {
  id: string;
  type: 'repair' | 'replacement' | 'inspection' | 'cleaning';
  fixture_id?: string;
  room_id?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduled_date: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  title: string;
  description?: string;
  estimated_duration?: number;
  assigned_to?: string;
}

export interface RoomLightingSummary {
  room_id: string;
  room_name: string;
  room_number: string;
  building_name: string;
  floor_name: string;
  total_fixtures: number;
  functional_fixtures: number;
  issues_count: number;
  maintenance_needed: number;
  health_score: number; // 0-100
  last_inspection?: string;
  next_maintenance?: string;
}

export interface LightingAlert {
  id: string;
  type: 'critical_outage' | 'maintenance_overdue' | 'bulk_failures' | 'emergency_lighting';
  title: string;
  message: string;
  count?: number;
  rooms?: string[];
  fixtures?: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}
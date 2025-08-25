export type LightingTab = 'overview' | 'fixtures' | 'rooms' | 'maintenance' | 'reports';

export interface QuickFilterState {
  showOnlyIssues?: boolean;
  showEmergencyOnly?: boolean;
  showMaintenanceNeeded?: boolean;
}

export interface LightingPageState {
  activeTab: LightingTab;
  selectedBuilding?: string;
  selectedFloor?: string;
  quickFilters: QuickFilterState;
}

export interface LightingIssue {
  id: string;
  fixture_id: string;
  issue_type: 'blown_bulb' | 'ballast_issue' | 'flickering' | 'dim_light' | 'power_issue' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'deferred';
  reported_at: string;
  resolved_at?: string;
  description: string;
  assigned_to?: string;
  resolution_notes?: string;
  days_open?: number;
}

export interface MaintenanceRecord {
  id: string;
  fixture_id: string;
  maintenance_type: 'routine' | 'preventive' | 'repair' | 'replacement';
  scheduled_date: string;
  completed_date?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  vendor?: string;
  cost?: number;
}

export interface VendorInfo {
  id: string;
  name: string;
  contact_email?: string;
  contact_phone?: string;
  specialties: string[];
  rating?: number;
  notes?: string;
}
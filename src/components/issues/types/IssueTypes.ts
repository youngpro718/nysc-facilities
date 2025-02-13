
export type IssueStatus = 'open' | 'in_progress' | 'resolved';
export type IssuePriority = 'low' | 'medium' | 'high';
export type FixtureType = 'standard' | 'emergency' | 'motion_sensor';
export type FixtureStatus = 'functional' | 'maintenance_needed' | 'non_functional' | 'pending_maintenance' | 'scheduled_replacement';
export type FixturePosition = 'ceiling' | 'wall' | 'floor' | 'desk' | 'recessed';
export type ResolutionType = 'fixed' | 'replaced' | 'maintenance_performed' | 'no_action_needed' | 'deferred' | 'other';
export type ImpactLevel = 'minimal' | 'moderate' | 'significant' | 'critical';

export interface RecurringPattern {
  is_recurring: boolean;
  frequency?: string;
  last_occurrence?: string;
  pattern_confidence: number;
}

export interface MaintenanceRequirements {
  scheduled: boolean;
  frequency?: string;
  last_maintenance?: string;
  next_due?: string;
}

export interface ElectricalIssues {
  short_circuit?: boolean;
  wiring_issues?: boolean;
  voltage_problems?: boolean;
  ballast_issue?: boolean;
}

export interface LightingFixture {
  name: string;
  type: FixtureType;
  status: FixtureStatus;
  position: FixturePosition;
  electrical_issues?: ElectricalIssues;
}

export interface IssueHistory {
  id: string;
  action_type: string;
  action_details: Record<string, any>;
  performed_by: string;
  performed_at: string;
  previous_status?: IssueStatus;
  new_status?: IssueStatus;
  notes?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  building_id?: string;
  floor_id?: string;
  room_id?: string;
  fixture_id?: string;
  photos: string[];
  created_at: string;
  updated_at: string;
  seen: boolean;
  assignee_id?: string;
  last_status_change?: string;
  last_updated_by?: string;
  tags?: string[];
  due_date?: string;
  date_info?: string;
  type: string;
  buildings?: {
    name: string;
  };
  floors?: {
    name: string;
  };
  rooms?: {
    name: string;
  };
  lighting_fixtures?: LightingFixture[];
  resolution_type?: ResolutionType;
  resolution_notes?: string;
  resolved_by?: string;
  resolution_date?: string;
  impact_level?: ImpactLevel;
  recurring_pattern?: RecurringPattern;
  maintenance_requirements?: MaintenanceRequirements;
}

export interface Comment {
  id: string;
  issue_id: string;
  content: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  attachments: string[];
  mentions: string[];
}

// Adding RoomHealth and Maintenance types
export interface RoomHealthMetrics {
  id: string;
  room_id: string;
  health_score: number;
  last_assessment_date: string;
  total_issues_count: number;
  open_issues_count: number;
  critical_issues_count: number;
  avg_resolution_time: string;
  recurring_issues_count: number;
  maintenance_compliance_score: number;
  last_maintenance_date?: string;
  next_maintenance_due?: string;
  metrics_data: Record<string, any>;
}

export interface RoomMaintenanceSchedule {
  id: string;
  room_id: string;
  schedule_type: 'preventive' | 'corrective' | 'routine' | 'emergency';
  frequency?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  last_completed_at?: string;
  next_due_at?: string;
  assigned_to?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  notes?: string;
  schedule_config: Record<string, any>;
}

export interface RoomIssueCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parent_category_id?: string;
  severity_threshold: number;
  requires_immediate_action: boolean;
}

// Adding IssueType as an alias for compatibility
export type IssueType = Issue;

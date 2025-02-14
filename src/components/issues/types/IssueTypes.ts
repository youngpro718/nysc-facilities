
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
  timeline?: IssueHistory[];  // Add this line to fix the timeline error
}

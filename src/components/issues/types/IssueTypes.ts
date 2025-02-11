
export type IssueStatus = 'open' | 'in_progress' | 'resolved';
export type IssuePriority = 'low' | 'medium' | 'high';
export type FixtureType = 'standard' | 'emergency' | 'motion_sensor';
export type FixtureStatus = 'functional' | 'maintenance_needed' | 'non_functional' | 'pending_maintenance' | 'scheduled_replacement';
export type FixturePosition = 'ceiling' | 'wall' | 'floor' | 'desk' | 'recessed';

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
}

// Adding IssueType as an alias for compatibility
export type IssueType = Issue;

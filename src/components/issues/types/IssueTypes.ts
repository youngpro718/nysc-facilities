
export type Issue = {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
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
  lighting_fixtures?: {
    name: string;
    type: 'standard' | 'emergency' | 'motion_sensor';
    status: 'functional' | 'maintenance_needed' | 'non_functional' | 'pending_maintenance' | 'scheduled_replacement';
    position: 'ceiling' | 'wall' | 'floor' | 'desk' | 'recessed';
    electrical_issues?: {
      short_circuit?: boolean;
      wiring_issues?: boolean;
      voltage_problems?: boolean;
      ballast_issue?: boolean;
    };
  }[];
};

// Adding IssueType as an alias for compatibility
export type IssueType = Issue;

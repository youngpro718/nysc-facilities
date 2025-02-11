
export type Issue = {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  building_id?: string;
  floor_id?: string;
  room_id?: string;
  photos: string[];
  created_at: string;
  updated_at: string;
  seen: boolean;
  assignee_id?: string;
  last_status_change?: string;
  last_updated_by?: string;
  tags?: string[];
  due_date?: string;
  type: string; // Making type required to match database schema
};

// Adding IssueType as an alias for compatibility
export type IssueType = Issue;

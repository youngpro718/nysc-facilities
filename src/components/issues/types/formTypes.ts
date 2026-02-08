
import { IssueStatus, IssuePriority, ResolutionType } from "./IssueTypes";
import { StandardizedIssueType } from "../constants/issueTypes";

export interface FormData {
  title?: string;
  description: string;
  status?: IssueStatus;
  priority: IssuePriority;
  due_date?: string;
  date_info?: string;
  resolution_type?: ResolutionType;
  resolution_notes?: string;
  assigned_to?: 'DCAS' | 'OCA' | 'Self' | 'Outside_Vendor';
  issue_type?: StandardizedIssueType;
  problem_type?: string;
  building_id?: string;
  floor_id?: string;
  room_id?: string;
  impact_level?: string;
  tags?: string[];
  // User contact information
  reporter_name?: string;
  reporter_phone?: string;
  reporter_department?: string;
  reporting_for_another_room?: boolean;
  recurring_pattern?: {
    is_recurring: boolean;
    frequency?: string;
    pattern_confidence?: number;
  };
  maintenance_requirements?: {
    scheduled: boolean;
    frequency?: string;
    next_due?: string;
  };
  lighting_details?: {
    fixture_status?: string;
    detected_issues?: string[];
    maintenance_history?: unknown[];
  };
}

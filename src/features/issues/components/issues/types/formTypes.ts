
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
  issue_type?: StandardizedIssueType;
  problem_type?: string;
  building_id?: string;
  floor_id?: string;
  room_id?: string;
  tags?: string[];
  // User contact information
  reporter_name?: string;
  reporter_phone?: string;
  reporter_department?: string;
  reporting_for_another_room?: boolean;
}

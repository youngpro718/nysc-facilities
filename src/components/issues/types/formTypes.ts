
import { IssueStatus, IssuePriority, ResolutionType } from "./IssueTypes";
import { IssueType } from "../constants/issueTypes";

export interface FormData {
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  due_date?: string;
  date_info?: string;
  resolution_type?: ResolutionType;
  resolution_notes?: string;
  assigned_to?: 'DCAS' | 'OCA' | 'Self' | 'Outside_Vendor';
  issue_type?: IssueType;
  problem_type?: string;
  building_id?: string;
  floor_id?: string;
  room_id?: string;
}

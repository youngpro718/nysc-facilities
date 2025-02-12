
import { IssueStatus, IssuePriority, ResolutionType } from "./IssueTypes";

export interface FormData {
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  due_date?: string;
  resolution_type?: ResolutionType;
  resolution_notes?: string;
  assignee_id?: string;
}

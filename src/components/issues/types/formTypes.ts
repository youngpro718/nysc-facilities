
import { IssuePriority, IssueType } from "../constants/issueTypes";
import { ResolutionType } from "./IssueTypes";

export interface FormData {
  title: string;
  description: string;
  priority: IssuePriority;
  building_id?: string;
  floor_id?: string;
  room_id?: string;
  issue_type: IssueType;
  problem_type?: string;
  resolution_type?: ResolutionType;
  resolution_notes?: string;
}

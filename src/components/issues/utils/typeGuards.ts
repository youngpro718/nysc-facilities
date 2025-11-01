
import { IssueStatus, IssuePriority } from "../types/IssueTypes";

export const isValidStatus = (status: string | null): status is IssueStatus => {
  return status === 'open' || status === 'in_progress' || status === 'resolved';
};

export const isValidPriority = (priority: string | null): priority is IssuePriority => {
  return priority === 'low' || priority === 'medium' || priority === 'high';
};

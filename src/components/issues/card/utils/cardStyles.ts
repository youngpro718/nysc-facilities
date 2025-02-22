
import { IssuePriority } from "../../types/IssueTypes";

export const getPriorityGradient = (priority: IssuePriority) => {
  switch (priority) {
    case 'high':
      return 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(239,68,68,0.1) 100%)';
    case 'medium':
      return 'linear-gradient(135deg, rgba(234,179,8,0.2) 0%, rgba(234,179,8,0.1) 100%)';
    case 'low':
      return 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.1) 100%)';
    default:
      return 'linear-gradient(135deg, rgba(156,163,175,0.2) 0%, rgba(156,163,175,0.1) 100%)';
  }
};

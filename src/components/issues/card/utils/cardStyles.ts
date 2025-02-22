
import { IssuePriority } from "../../types/IssueTypes";

export const getPriorityGradient = (priority: IssuePriority) => {
  switch (priority) {
    case 'high':
      return 'linear-gradient(135deg, rgb(239,68,68) 0%, rgb(185,28,28) 100%)';
    case 'medium':
      return 'linear-gradient(135deg, rgb(234,179,8) 0%, rgb(161,98,7) 100%)';
    case 'low':
      return 'linear-gradient(135deg, rgb(34,197,94) 0%, rgb(21,128,61) 100%)';
    default:
      return 'linear-gradient(135deg, rgb(156,163,175) 0%, rgb(75,85,99) 100%)';
  }
};


import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

export const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    case 'in_progress':
      return <Clock className="h-5 w-5 text-blue-500" />;
    case 'resolved':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-gray-500" />;
  }
};

export const getPriorityClass = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-green-100 text-green-800';
  }
};

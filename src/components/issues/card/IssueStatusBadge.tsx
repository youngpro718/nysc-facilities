
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type StatusStyle = {
  icon: JSX.Element;
  badge: string;
};

export const getStatusStyle = (status: string): StatusStyle => {
  switch (status.toLowerCase()) {
    case 'open':
      return {
        icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
        badge: 'border-yellow-500 text-yellow-700 bg-yellow-50'
      };
    case 'in_progress':
      return {
        icon: <Clock className="h-5 w-5 text-blue-500" />,
        badge: 'border-blue-500 text-blue-700 bg-blue-50'
      };
    case 'resolved':
      return {
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        badge: 'border-green-500 text-green-700 bg-green-50'
      };
    default:
      return {
        icon: <AlertCircle className="h-5 w-5 text-gray-500" />,
        badge: 'border-gray-500 text-gray-700 bg-gray-50'
      };
  }
};

interface IssueStatusBadgeProps {
  status: "open" | "in_progress" | "resolved";
}

export const IssueStatusBadge = ({ status }: IssueStatusBadgeProps) => {
  const statusStyle = getStatusStyle(status);
  
  return (
    <Badge variant="outline" className={`animate-in fade-in-50 ${statusStyle.badge}`}>
      <div className="flex items-center gap-1">
        {statusStyle.icon}
        <span>{status}</span>
      </div>
    </Badge>
  );
};

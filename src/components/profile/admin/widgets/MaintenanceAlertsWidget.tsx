import { MobileAdminCard } from "../../../profile/mobile/MobileAdminCard";
import { AlertTriangle, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MaintenanceAlertsWidgetProps {
  stats: {
    activeIssues: number;
  };
}

export function MaintenanceAlertsWidget({ stats }: MaintenanceAlertsWidgetProps) {
  const navigate = useNavigate();

  const issueActions = [
    {
      id: 'active-issues',
      title: 'Active Issues',
      description: 'Review and resolve open issues',
      icon: AlertTriangle,
      count: stats.activeIssues,
      status: stats.activeIssues > 0 ? 'error' as const : 'success' as const,
      action: () => navigate('/issues')
    },
    {
      id: 'issue-reports',
      title: 'Generate Reports',
      description: 'Create issue and performance reports',
      icon: FileText,
      action: () => {
        window.dispatchEvent(new CustomEvent('switchToTab', { detail: 'reports' }));
      }
    }
  ];

  return (
    <MobileAdminCard
      title="Issues & Reports"
      description="Track issues and generate reports"
      actions={issueActions}
      variant="activity"
    />
  );
}
import { MobileAdminCard } from "../../../profile/mobile/MobileAdminCard";
import { Database, Shield, Activity } from "lucide-react";

interface QuickAdminActionsWidgetProps {
  stats: {
    lastBackup: string;
  };
  onOpenSystemSecurity: () => void;
}

export function QuickAdminActionsWidget({ stats, onOpenSystemSecurity }: QuickAdminActionsWidgetProps) {
  const systemActions = [
    {
      id: 'database-health',
      title: 'Database Health',
      description: 'Monitor database performance',
      icon: Database,
      status: 'success' as const,
      action: onOpenSystemSecurity
    },
    {
      id: 'system-backup',
      title: 'System Backup',
      description: `Last backup: ${stats.lastBackup}`,
      icon: Shield,
      status: 'success' as const,
      action: onOpenSystemSecurity
    },
    {
      id: 'activity-logs',
      title: 'Activity Logs',
      description: 'View system activity and audit logs',
      icon: Activity,
      action: onOpenSystemSecurity
    }
  ];

  return (
    <MobileAdminCard
      title="System & Security"
      description="Monitor system health and security"
      actions={systemActions}
      variant="security"
    />
  );
}
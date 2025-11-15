import { MobileAdminCard } from "../../../profile/mobile/MobileAdminCard";
import { Users, UserCheck, Shield } from "lucide-react";

interface UserManagementWidgetProps {
  stats: {
    totalUsers: number;
    pendingVerifications: number;
  };
  onOpenUserManagement: () => void;
}

export function UserManagementWidget({ stats, onOpenUserManagement }: UserManagementWidgetProps) {
  const userManagementActions = [
    {
      id: 'view-users',
      title: 'View All Users',
      description: 'Manage user accounts and permissions',
      icon: Users,
      count: stats.totalUsers,
      status: 'success' as const,
      action: onOpenUserManagement
    },
    {
      id: 'pending-verifications',
      title: 'Pending Verifications',
      description: 'Review user verification requests',
      icon: UserCheck,
      count: stats.pendingVerifications,
      status: stats.pendingVerifications > 0 ? 'warning' as const : 'success' as const,
      action: onOpenUserManagement
    },
    {
      id: 'user-roles',
      title: 'Manage Roles',
      description: 'Assign and modify user roles',
      icon: Shield,
      action: onOpenUserManagement
    }
  ];

  return (
    <MobileAdminCard
      title="User Management"
      description="Manage users, verifications, and permissions"
      actions={userManagementActions}
      variant="default"
    />
  );
}
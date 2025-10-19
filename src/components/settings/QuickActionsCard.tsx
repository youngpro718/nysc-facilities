import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserX, UserCheck, AlertCircle } from "lucide-react";

interface QuickActionsCardProps {
  pendingCount: number;
  suspendedCount: number;
  noRoleCount: number;
  issuesCount: number;
  onOpenModal: (filter?: string) => void;
}

export function QuickActionsCard({
  pendingCount,
  suspendedCount,
  noRoleCount,
  issuesCount,
  onOpenModal
}: QuickActionsCardProps) {
  const actions = [
    {
      id: 'pending',
      label: 'Review Pending Users',
      count: pendingCount,
      icon: UserCheck,
      variant: 'default' as const,
      show: pendingCount > 0
    },
    {
      id: 'suspended',
      label: 'Manage Suspended Accounts',
      count: suspendedCount,
      icon: UserX,
      variant: 'destructive' as const,
      show: suspendedCount > 0
    },
    {
      id: 'no_role',
      label: 'Assign User Roles',
      count: noRoleCount,
      icon: Users,
      variant: 'secondary' as const,
      show: noRoleCount > 0
    },
    {
      id: 'issues',
      label: 'Review Users with Issues',
      count: issuesCount,
      icon: AlertCircle,
      variant: 'outline' as const,
      show: issuesCount > 0
    }
  ];

  const visibleActions = actions.filter(action => action.show);

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
        <CardDescription>Common user management tasks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {visibleActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant={action.variant}
              className="w-full justify-between"
              onClick={() => onOpenModal(action.id)}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {action.label}
              </span>
              <span className="font-bold">{action.count}</span>
            </Button>
          );
        })}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onOpenModal()}
        >
          View All Users
        </Button>
      </CardContent>
    </Card>
  );
}

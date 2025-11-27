import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Lock, UserCog, Mail, Shield, Wrench, Users, UserCheck, AlertCircle } from 'lucide-react';
import { useUserManagement } from "@/hooks/admin/useUserManagement";
import { QuickActionsCard } from "./QuickActionsCard";
import { useState } from "react";
import { EnhancedUserManagementModal } from "@/components/profile/modals/EnhancedUserManagementModal";

interface Feature {
  name: string;
  description: string;
  icon: React.ElementType;
  available: boolean;
}

const enhancedUserControlsFeatures: Feature[] = [
  {
    name: 'Password Reset',
    description: 'Send password reset emails to any user',
    icon: Mail,
    available: true,
  },
  {
    name: 'Account Suspension',
    description: 'Suspend/unsuspend user accounts with reasons',
    icon: Lock,
    available: true,
  },
  {
    name: 'Profile Editing',
    description: 'Edit user profiles including name, email, department',
    icon: UserCog,
    available: true,
  },
  {
    name: 'Verification Override',
    description: 'Manually verify users and set approval status',
    icon: Shield,
    available: true,
  },
  {
    name: 'Account Fixes',
    description: 'One-click fix for account issues',
    icon: Wrench,
    available: true,
  },
  {
    name: 'Audit Logging',
    description: 'All actions are logged for security audit',
    icon: CheckCircle,
    available: true,
  },
];

export function FeatureDiscoveryCard() {
  const { users, userStats } = useUserManagement();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFilter, setModalFilter] = useState<string | undefined>();

  const hasIssues = (user: any) => {
    return !user.is_approved || user.verification_status === 'rejected';
  };

  const noRoleUsers = users.filter(u => !u.title && u.role !== 'admin');
  const issuesUsers = users.filter(hasIssues);
  const suspendedUsers = users.filter(u => (u as any).is_suspended);

  const handleOpenModal = (filter?: string) => {
    setModalFilter(filter);
    setModalOpen(true);
  };

  return (
    <>
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-primary" />
          Enhanced User Controls
        </CardTitle>
        <CardDescription>
          Advanced user management capabilities available to administrators
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {enhancedUserControlsFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg border bg-background hover:bg-accent/50 transition-colors"
              >
                <div className="mt-0.5">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{feature.name}</p>
                    {feature.available && (
                      <Badge variant="secondary" className="text-xs h-5">
                        Available
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {/* Live Statistics */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-semibold mb-3">User Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-3 hover:bg-primary/5"
              onClick={() => handleOpenModal('pending')}
            >
              <div className="flex items-center gap-2 w-full">
                <UserCheck className="h-4 w-4 text-yellow-600" />
                <span className="text-xs font-medium">Pending</span>
              </div>
              <span className="text-2xl font-bold mt-1">{userStats.pending}</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start p-3 hover:bg-primary/5"
              onClick={() => handleOpenModal('suspended')}
            >
              <div className="flex items-center gap-2 w-full">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-xs font-medium">Suspended</span>
              </div>
              <span className="text-2xl font-bold mt-1">{suspendedUsers.length}</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start p-3 hover:bg-primary/5"
              onClick={() => handleOpenModal('no_role')}
            >
              <div className="flex items-center gap-2 w-full">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium">No Role</span>
              </div>
              <span className="text-2xl font-bold mt-1">{noRoleUsers.length}</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start p-3 hover:bg-primary/5"
              onClick={() => handleOpenModal('issues')}
            >
              <div className="flex items-center gap-2 w-full">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-xs font-medium">Issues</span>
              </div>
              <span className="text-2xl font-bold mt-1">{issuesUsers.length}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <QuickActionsCard
      pendingCount={userStats.pending}
      suspendedCount={suspendedUsers.length}
      noRoleCount={noRoleUsers.length}
      issuesCount={issuesUsers.length}
      onOpenModal={handleOpenModal}
    />

    <EnhancedUserManagementModal
      open={modalOpen}
      onOpenChange={setModalOpen}
    />
    </>
  );
}

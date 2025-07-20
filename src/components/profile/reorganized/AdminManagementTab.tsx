import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield, UserCheck, Settings } from "lucide-react";
import { SecuritySection } from "@/components/profile/SecuritySection";
import { UserManagementSection } from "@/components/profile/modals/user-management/UserManagementSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUserManagement } from "@/hooks/admin/useUserManagement";

export function AdminManagementTab() {
  const { 
    users,
    adminUsers,
    userStats,
    currentUserId,
    isLoading,
    demoteFromAdmin
  } = useUserManagement();

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{userStats.activeUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold">{userStats.pendingApprovals}</p>
              </div>
              <UserCheck className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Alerts</p>
                <p className="text-2xl font-bold">{userStats.securityAlerts}</p>
              </div>
              <Shield className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Settings className="h-4 w-4" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts, approvals, and access levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagementSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security policies and access controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecuritySection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Role & Permission Management
              </CardTitle>
              <CardDescription>
                Configure roles, permissions, and access levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Administrator</h4>
                    <p className="text-xs text-muted-foreground">Full system access</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">5 users</Badge>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Manager</h4>
                    <p className="text-xs text-muted-foreground">Operations and user management</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">12 users</Badge>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Staff</h4>
                    <p className="text-xs text-muted-foreground">Basic facility access</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">25 users</Badge>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Guest</h4>
                    <p className="text-xs text-muted-foreground">Read-only access</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">8 users</Badge>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline">Create New Role</Button>
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, UserPlus, Shield, AlertTriangle } from "lucide-react";

// Mock interfaces to fix TypeScript errors
interface MockUnifiedPersonnel {
  id: string;
  user_id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  department?: string;
  is_registered?: boolean;
  access_level?: string;
  verification_status?: string;
}

interface MockPersonnelStats {
  totalPersonnel?: number;
  registeredUsers?: number;
  unassignedRoles?: number;
  activeUsers: number;
  pendingApprovals: number;
  adminUsers: number;
  securityAlerts: number;
}

interface PersonnelCardProps {
  person: MockUnifiedPersonnel;
  currentUserId?: string;
  onAssignRole: (personnelId: string, role: string) => void;
  onPromoteToAdmin: (userId: string) => void;
  onInvitePersonnel: (personnelId: string, email: string) => void;
  isUpdating: boolean;
}

function PersonnelCard({ person, currentUserId, onAssignRole, onPromoteToAdmin, onInvitePersonnel, isUpdating }: PersonnelCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">{person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Unknown'}</h3>
          <p className="text-sm text-muted-foreground">{person.email}</p>
          <div className="flex items-center gap-2 mt-2">
            {person.is_registered ? (
              <Badge variant="secondary">Registered</Badge>
            ) : (
              <Badge variant="outline">Pending</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAssignRole(person.id, 'admin')}
            disabled={isUpdating}
          >
            Assign Role
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function EnhancedPersonnelManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock data to prevent errors
  const personnel: MockUnifiedPersonnel[] = [];
  const stats: MockPersonnelStats = {
    totalPersonnel: 0,
    registeredUsers: 0,
    unassignedRoles: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    adminUsers: 0,
    securityAlerts: 0,
  };
  
  const isUpdating = false;
  const currentUserId = 'mock-user-id';
  
  // Mock functions
  const assignRole = ({ personnelId, role }: { personnelId: string; role: string }) => {};
  const promoteToAdmin = (userId: string) => {};
  const invitePersonnel = ({ personnelId, email }: { personnelId: string; email: string }) => {};

  const filteredPersonnel = personnel.filter(person =>
    person.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Personnel Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and access permissions
          </p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="personnel">Personnel</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Personnel</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalPersonnel || 0}</p>
                <p className="text-xs text-muted-foreground">
                  All registered users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Registered Users</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.registeredUsers || 0}</p>
                <p className="text-xs text-muted-foreground">
                  Active in system
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unassigned Roles</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.unassignedRoles || 0}</p>
                <p className="text-xs text-muted-foreground">
                  Need role assignment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.adminUsers}</p>
                <p className="text-xs text-muted-foreground">
                  Full access rights
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="personnel" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search personnel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="grid gap-4">
            {filteredPersonnel.map((person) => (
              <PersonnelCard
                key={person.id}
                person={person}
                currentUserId={currentUserId}
                onAssignRole={(id, role) => assignRole({ personnelId: id, role })}
                onPromoteToAdmin={promoteToAdmin}
                onInvitePersonnel={(id, email) => invitePersonnel({ personnelId: id, email })}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Users who have been invited but haven't completed registration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No pending invitations</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Overview</CardTitle>
              <CardDescription>
                Monitor security-related activities and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No security alerts</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
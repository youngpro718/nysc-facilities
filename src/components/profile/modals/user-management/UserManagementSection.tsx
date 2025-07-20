import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, Crown, ArrowUp, ArrowDown, UserCheck, UserX, Settings } from "lucide-react";
import { useUserManagement, type User } from "@/hooks/admin/useUserManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserCardProps {
  user: User;
  currentUserId: string | null;
  onPromoteToAdmin: (userId: string) => void;
  onDemoteFromAdmin: (userId: string) => void;
  onApproveUser: (userId: string) => void;
  onRejectUser: (userId: string) => void;
  onUpdateAccessLevel: (userId: string, level: User['access_level']) => void;
  isUpdating: boolean;
}

function UserCard({ 
  user, 
  currentUserId, 
  onPromoteToAdmin,
  onDemoteFromAdmin,
  onApproveUser,
  onRejectUser,
  onUpdateAccessLevel,
  isUpdating 
}: UserCardProps) {
  const isCurrentUser = user.id === currentUserId;
  const isAdmin = user.access_level === 'admin';
  const canPromote = !isAdmin && user.is_approved;
  const canDemote = isAdmin && !isCurrentUser;

  const getAccessLevelColor = (level: User['access_level']) => {
    switch (level) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'write': return 'bg-blue-100 text-blue-800';
      case 'read': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationColor = (status: User['verification_status']) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium">
              {user.first_name?.[0] || user.email[0].toUpperCase()}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">
                {user.first_name && user.last_name 
                  ? `${user.first_name} ${user.last_name}`
                  : user.email
                }
              </h4>
              {isCurrentUser && (
                <Badge variant="outline" className="text-xs">You</Badge>
              )}
              {isAdmin && (
                <Crown className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              {user.email}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={`text-xs ${getAccessLevelColor(user.access_level)}`}>
                {user.access_level.toUpperCase()}
              </Badge>
              <Badge className={`text-xs ${getVerificationColor(user.verification_status)}`}>
                {user.verification_status.toUpperCase()}
              </Badge>
              {user.is_approved ? (
                <Badge variant="outline" className="text-xs text-green-600">
                  APPROVED
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-orange-600">
                  PENDING
                </Badge>
              )}
            </div>
            {user.department && (
              <p className="text-xs text-muted-foreground mt-1">
                {user.department} {user.title && `• ${user.title}`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!user.is_approved && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onApproveUser(user.id)}
                disabled={isUpdating}
                className="text-green-600 hover:text-green-700"
              >
                <UserCheck className="h-3 w-3 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRejectUser(user.id)}
                disabled={isUpdating}
                className="text-red-600 hover:text-red-700"
              >
                <UserX className="h-3 w-3 mr-1" />
                Reject
              </Button>
            </>
          )}
          
          {canPromote && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPromoteToAdmin(user.id)}
              disabled={isUpdating}
              className="text-blue-600 hover:text-blue-700"
            >
              <ArrowUp className="h-3 w-3 mr-1" />
              Make Admin
            </Button>
          )}
          
          {canDemote && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDemoteFromAdmin(user.id)}
              disabled={isUpdating}
              className="text-orange-600 hover:text-orange-700"
            >
              <ArrowDown className="h-3 w-3 mr-1" />
              Remove Admin
            </Button>
          )}

          {user.is_approved && user.access_level !== 'admin' && (
            <select
              value={user.access_level}
              onChange={(e) => onUpdateAccessLevel(user.id, e.target.value as User['access_level'])}
              disabled={isUpdating}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="read">Read</option>
              <option value="write">Write</option>
            </select>
          )}
        </div>
      </div>
    </Card>
  );
}

export function UserManagementSection() {
  const {
    users,
    adminUsers,
    userStats,
    currentUserId,
    isLoading,
    promoteToAdmin,
    demoteFromAdmin,
    approveUser,
    rejectUser,
    updateAccessLevel,
    isPromoting,
    isDemoting,
    isApproving,
    isRejecting,
    isUpdatingAccess
  } = useUserManagement();

  const isUpdating = isPromoting || isDemoting || isApproving || isRejecting || isUpdatingAccess;

  const pendingUsers = users.filter(u => !u.is_approved || u.verification_status === 'pending');
  const approvedUsers = users.filter(u => u.is_approved && u.verification_status === 'verified');

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{userStats.totalUsers}</p>
            </div>
            <Shield className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold">{userStats.activeUsers}</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-bold">{userStats.pendingApprovals}</p>
            </div>
            <Settings className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Administrators</p>
              <p className="text-2xl font-bold">{userStats.adminUsers}</p>
            </div>
            <Crown className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* User Management Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Users ({users.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingUsers.length})</TabsTrigger>
          <TabsTrigger value="admins">Administrators ({adminUsers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-4">
            {approvedUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                currentUserId={currentUserId}
                onPromoteToAdmin={promoteToAdmin}
                onDemoteFromAdmin={demoteFromAdmin}
                onApproveUser={approveUser}
                onRejectUser={rejectUser}
                onUpdateAccessLevel={updateAccessLevel}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingUsers.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No pending user approvals</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  currentUserId={currentUserId}
                  onPromoteToAdmin={promoteToAdmin}
                  onDemoteFromAdmin={demoteFromAdmin}
                  onApproveUser={approveUser}
                  onRejectUser={rejectUser}
                  onUpdateAccessLevel={updateAccessLevel}
                  isUpdating={isUpdating}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <div className="space-y-4">
            {adminUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                currentUserId={currentUserId}
                onPromoteToAdmin={promoteToAdmin}
                onDemoteFromAdmin={demoteFromAdmin}
                onApproveUser={approveUser}
                onRejectUser={rejectUser}
                onUpdateAccessLevel={updateAccessLevel}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserActionsMenu } from "./UserActionsMenu";
import { UserStatusBadges } from "./UserStatusBadges";
import { AlertCircle, Pencil, Shield, UserX } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  verification_status: string;
  is_approved: boolean;
  created_at: string;
  department: string;
  title: string;
  is_admin?: boolean;
  is_suspended?: boolean;
  access_level?: 'none' | 'read' | 'write' | 'admin';
  metadata?: any;
  suspension_reason?: string;
  suspended_at?: string;
}

interface AllUsersSectionProps {
  users: User[];
  loading: boolean;
  currentUserId: string | null;
  onPromoteToAdmin?: (user: User) => void;
  onDemoteFromAdmin?: (user: User) => void;
  onFixAccount?: (userId: string) => void;
  onSuspend?: (userId: string) => void;
  onUnsuspend?: (userId: string) => void;
  onEditProfile?: (user: User) => void;
  onResetPassword?: (email: string) => void;
  onOverrideVerification?: (userId: string) => void;
}

type FilterType = 'all' | 'pending' | 'suspended' | 'no_role' | 'issues';

import { SYSTEM_ROLES, getRoleLabel, getRoleBadgeClasses } from "@/config/roles";

export function AllUsersSection({
  users,
  loading,
  currentUserId,
  onPromoteToAdmin,
  onDemoteFromAdmin,
  onFixAccount,
  onSuspend,
  onUnsuspend,
  onEditProfile,
  onResetPassword,
  onOverrideVerification
}: AllUsersSectionProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const hasIssues = (user: User) => {
    return !user.is_approved || user.verification_status === 'rejected';
  };

  const filteredUsers = users.filter(user => {
    switch (filter) {
      case 'pending':
        return user.verification_status === 'pending';
      case 'suspended':
        return user.is_suspended;
      case 'no_role':
        return !user.title && !user.is_admin;
      case 'issues':
        return hasIssues(user);
      default:
        return true;
    }
  });

  const handleEditRole = (user: User) => {
    setEditingUser(user);
    setEditRole(user.title || "");
    setEditTitle(user.title || "");
  };

  const handleSaveRole = async () => {
    if (!editingUser || !editRole) return;

    setSaving(true);
    try {
      // Update title first (no type conflicts)
      const { error: titleError } = await supabase
        .from('profiles')
        .update({ title: editTitle })
        .eq('id', editingUser.id);

      if (titleError) throw titleError;

      // Update role separately to avoid function overloading issues
      // Use RPC function if available, otherwise direct update
      try {
        const { error: roleError } = await supabase.rpc('admin_update_user_role', {
          target_user_id: editingUser.id,
          new_role: editRole
        });
        
        if (roleError) {
          // Fallback to direct update if RPC doesn't exist
          const { error: directError } = await supabase
            .from('profiles')
            .update({ role: editRole })
            .eq('id', editingUser.id);
          
          if (directError) throw directError;
        }
      } catch (rpcError: any) {
        // If RPC function doesn't exist, try direct update
        if (rpcError.code === '42883') { // Function does not exist
          const { error: directError } = await supabase
            .from('profiles')
            .update({ role: editRole })
            .eq('id', editingUser.id);
          
          if (directError) throw directError;
        } else {
          throw rpcError;
        }
      }

      toast.success("User role updated successfully");
      setEditingUser(null);
      setEditRole("");
      setEditTitle("");
      
      // Parent component will refresh the users list automatically
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.message || "Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All Users ({users.length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pending ({users.filter(u => u.verification_status === 'pending').length})
          </Button>
          <Button
            variant={filter === 'suspended' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('suspended')}
          >
            Suspended ({users.filter(u => u.is_suspended).length})
          </Button>
          <Button
            variant={filter === 'no_role' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('no_role')}
          >
            No Role ({users.filter(u => !u.title && !u.is_admin).length})
          </Button>
          <Button
            variant={filter === 'issues' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('issues')}
          >
            Has Issues ({users.filter(hasIssues).length})
          </Button>
        </div>

        {/* User Cards */}
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No users found with this filter</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <Card
                key={user.id}
                className={`${
                  user.is_suspended
                    ? 'border-l-4 border-l-destructive'
                    : user.is_admin
                    ? 'border-l-4 border-l-primary'
                    : user.verification_status === 'verified' && user.is_approved
                    ? 'border-l-4 border-l-green-500'
                    : 'border-l-4 border-l-yellow-500'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-base">
                            {user.first_name} {user.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <UserStatusBadges
                          verificationStatus={user.verification_status}
                          isApproved={user.is_approved}
                          isSuspended={user.is_suspended}
                          isAdmin={user.is_admin}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Department:</span>{' '}
                          <span>{user.department || 'Not set'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Title:</span>{' '}
                          <span>{user.title || 'Not set'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Created:</span>{' '}
                          <span>{formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</span>
                        </div>
                        {user.is_admin && (
                          <div>
                            <Badge variant="default" className="gap-1">
                              <Shield className="h-3 w-3" />
                              Administrator
                            </Badge>
                          </div>
                        )}
                      </div>

                      {hasIssues(user) && !user.is_suspended && (
                        <div className="flex items-center gap-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <p className="text-xs text-yellow-700">
                            {!user.is_approved && 'Pending approval'}
                            {user.verification_status === 'rejected' && 'Verification rejected'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRole(user)}
                        className="gap-2"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit Role
                      </Button>

                      {onPromoteToAdmin && !user.is_admin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPromoteToAdmin(user)}
                          className="gap-2"
                        >
                          <Shield className="h-4 w-4" />
                          Make Admin
                        </Button>
                      )}

                      {onDemoteFromAdmin && user.is_admin && user.id !== currentUserId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDemoteFromAdmin(user)}
                          className="gap-2"
                        >
                          <UserX className="h-4 w-4" />
                          Remove Admin
                        </Button>
                      )}

                      <UserActionsMenu
                        user={user}
                        onFixAccount={onFixAccount}
                        onSuspend={onSuspend}
                        onUnsuspend={onUnsuspend}
                        onEditProfile={onEditProfile}
                        onResetPassword={onResetPassword}
                        onOverrideVerification={onOverrideVerification}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Update {editingUser?.first_name}'s job title and access level
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g., Supply Clerk"
              />
            </div>
            <div className="space-y-2">
              <Label>Access Level</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {SYSTEM_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={saving || !editRole}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Users, Pencil, Shield, Search, RefreshCw } from "lucide-react";
import { CourtRole } from "@/hooks/useRolePermissions";
import { getRoleFromTitle, getRoleDescriptionFromTitle, getAccessDescriptionFromTitle } from "@/utils/titleToRoleMapping";

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  title: string | null;
  department: string | null;
  role: string | null;
  created_at: string;
}

const AVAILABLE_ROLES: Array<{ value: CourtRole; label: string; description: string }> = [
  { value: "standard", label: "Standard User", description: "Basic access - can report issues and make requests" },
  { value: "supply_room_staff", label: "Supply Staff", description: "Manages inventory and fulfills supply requests" },
  { value: "clerk", label: "Court Manager", description: "Manages courts and court operations" },
  { value: "facilities_manager", label: "Facility Coordinator (Admin)", description: "Full access to everything" },
];

export function UserManagementTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editRole, setEditRole] = useState<CourtRole | "">("");
  const [detectedRole, setDetectedRole] = useState<string>("");
  const queryClient = useQueryClient();

  // Fetch all users
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, title, department, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles for each user
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Merge profiles with roles
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        role: roles?.find(r => r.user_id === profile.id)?.role || null,
      })) || [];

      return usersWithRoles as UserProfile[];
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, title, role }: { userId: string; title: string; role: CourtRole }) => {
      console.log("[UserManagement] Updating user:", { userId, title, role });

      // Update profile title
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (profileError) {
        console.error("[UserManagement] Profile update error:", profileError);
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }

      console.log("[UserManagement] Profile updated successfully");

      // Try to use RPC function to update role (bypasses RLS issues)
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('admin_update_user_role', {
          target_user_id: userId,
          new_role: role
        });

        if (rpcError) {
          console.warn("[UserManagement] RPC function not available, using direct update:", rpcError);
          
          // Fallback to direct update
          const { data: existingRole } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("user_id", userId)
            .maybeSingle();

          if (existingRole) {
            // Update existing role
            const { error: updateError } = await supabase
              .from("user_roles")
              .update({ role })
              .eq("user_id", userId);

            if (updateError) {
              console.error("[UserManagement] Role update error:", updateError);
              throw new Error(`Failed to update role: ${updateError.message}`);
            }
          } else {
            // Insert new role
            const { error: insertError } = await supabase
              .from("user_roles")
              .insert({ user_id: userId, role });

            if (insertError) {
              console.error("[UserManagement] Role insert error:", insertError);
              throw new Error(`Failed to insert role: ${insertError.message}`);
            }
          }
        } else {
          console.log("[UserManagement] Role updated via RPC successfully");
        }
      } catch (err: any) {
        console.error("[UserManagement] Error updating role:", err);
        throw err;
      }

      return { userId, title, role };
    },
    onSuccess: () => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditingUser(null);
      setEditTitle("");
      setEditRole("");
      setDetectedRole("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setEditTitle(user.title || "");
    setEditRole((user.role as CourtRole) || "");
    
    if (user.title) {
      const detected = getRoleDescriptionFromTitle(user.title);
      setDetectedRole(detected);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setEditTitle(newTitle);
    if (newTitle) {
      const detected = getRoleDescriptionFromTitle(newTitle);
      const detectedRoleValue = getRoleFromTitle(newTitle);
      setDetectedRole(detected);
      setEditRole(detectedRoleValue);
    } else {
      setDetectedRole("");
    }
  };

  const handleSaveUser = () => {
    if (!editingUser || !editRole) {
      toast.error("Please select a role");
      return;
    }

    updateUserMutation.mutate({
      userId: editingUser.id,
      title: editTitle,
      role: editRole as CourtRole,
    });
  };

  const filteredUsers = users?.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.title?.toLowerCase().includes(searchLower) ||
      user.department?.toLowerCase().includes(searchLower)
    );
  });

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case "admin":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      case "facilities_manager":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "supply_room_staff":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "judge":
      case "clerk":
      case "court_aide":
        return "bg-purple-500/10 text-purple-700 border-purple-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage user titles and access levels
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, email, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-md border">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers && filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        {user.title ? (
                          <span className="text-sm">{user.title}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">No title</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.department || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {user.role ? (
                          <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                            {user.role.replace(/_/g, " ")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-500/10">
                            No role
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditUser(user)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Edit User Access</DialogTitle>
                              <DialogDescription>
                                Update {user.first_name}'s job title and access level
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="title">Job Title</Label>
                                <Input
                                  id="title"
                                  value={editTitle}
                                  onChange={(e) => handleTitleChange(e.target.value)}
                                  placeholder="e.g., Supply Clerk"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="role">Access Level</Label>
                                <Select
                                  value={editRole}
                                  onValueChange={(value) => setEditRole(value as CourtRole)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose access level" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {AVAILABLE_ROLES.map((role) => (
                                      <SelectItem key={role.value} value={role.value}>
                                        <div className="flex flex-col py-1">
                                          <span className="font-semibold">{role.label}</span>
                                          <span className="text-xs text-muted-foreground">{role.description}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                                <Shield className="h-4 w-4 text-primary" />
                                <p className="text-xs text-muted-foreground">
                                  Changes apply immediately. User may need to refresh their browser.
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <DialogTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogTrigger>
                              <Button
                                onClick={handleSaveUser}
                                disabled={updateUserMutation.isPending}
                              >
                                {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Total Users</CardDescription>
              <CardTitle className="text-2xl">{users?.length || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Admins</CardDescription>
              <CardTitle className="text-2xl">
                {users?.filter(u => u.role === "admin").length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Supply Staff</CardDescription>
              <CardTitle className="text-2xl">
                {users?.filter(u => u.role === "supply_room_staff").length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">No Role</CardDescription>
              <CardTitle className="text-2xl">
                {users?.filter(u => !u.role).length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

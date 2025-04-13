import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, Search, UserPlus, RefreshCw, Building, Key, ShieldAlert } from "lucide-react";
import { useAllUsers } from "./hooks/useAllUsers";
import { UsersTable } from "./UsersTable";
import { AssignRoomsDialog } from "@/components/occupants/AssignRoomsDialog";
import { AssignKeysDialog } from "@/components/occupants/AssignKeysDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AddUserDialog } from "./AddUserDialog";
import { useAuth } from "@/hooks/useAuth";

export function UsersSection() {
  const [showAssignRooms, setShowAssignRooms] = useState(false);
  const [showAssignKeys, setShowAssignKeys] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { isAuthenticated, loading: authLoading } = useAuth();

  const {
    users,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    roleFilter,
    setRoleFilter,
    departments,
    updateUserStatus,
    updateUserRole,
    deleteUser,
    refetch
  } = useAllUsers();

  const handleAssignRooms = (userId: string) => {
    setSelectedUserId(userId);
    setShowAssignRooms(true);
  };

  const handleAssignKeys = (userId: string) => {
    setSelectedUserId(userId);
    setShowAssignKeys(true);
  };

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete);
      setUserToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, selected: boolean) => {
    if (selected) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  // If not authenticated, show auth error
  if (authLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p>Checking authentication status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-amber-500">
            <ShieldAlert className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p>You need to be signed in to access the user management section.</p>
            <p className="text-sm text-muted-foreground mt-2">Please refresh the page and sign in with an administrator account.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <p>Error loading users: {error instanceof Error ? error.message : "Unknown error"}</p>
            <Button 
              variant="outline" 
              onClick={() => refetch()} 
              className="mt-4"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage all users in the system
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddUser(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Selected users actions */}
            {selectedUsers.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <span className="text-sm font-medium">
                  {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                </span>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleAssignRooms(selectedUsers[0])}>
                    <Building className="mr-2 h-4 w-4" />
                    Assign Rooms
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleAssignKeys(selectedUsers[0])}>
                    <Key className="mr-2 h-4 w-4" />
                    Assign Keys
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setSelectedUsers([])}>
                    Clear Selection
                  </Button>
                </div>
              </div>
            )}
            
            {/* Users table */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No users found. Try adjusting your filters or add a new user.</p>
              </div>
            ) : (
              <UsersTable 
                users={users}
                selectable={true}
                selectedUsers={selectedUsers}
                onSelectAll={handleSelectAll}
                onSelectUser={handleSelectUser}
                onUpdateStatus={updateUserStatus}
                onUpdateRole={updateUserRole}
                onDeleteUser={handleDeleteUser}
                onAssignRooms={handleAssignRooms}
                onAssignKeys={handleAssignKeys}
              />
            )}
            
            {/* Results count */}
            <div className="text-sm text-muted-foreground">
              Showing {users.length} user{users.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Dialogs */}
      {selectedUserId && (
        <>
          <AssignRoomsDialog
            open={showAssignRooms}
            onOpenChange={setShowAssignRooms}
            selectedOccupants={selectedUserId ? [selectedUserId] : []}
            onSuccess={() => setShowAssignRooms(false)}
          />
          
          <AssignKeysDialog
            open={showAssignKeys}
            onOpenChange={setShowAssignKeys}
            selectedOccupants={selectedUserId ? [selectedUserId] : []}
            onSuccess={() => setShowAssignKeys(false)}
          />
        </>
      )}
      
      <AddUserDialog
        open={showAddUser}
        onOpenChange={setShowAddUser}
        onSuccess={refetch}
        departments={departments}
      />
      
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              account and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

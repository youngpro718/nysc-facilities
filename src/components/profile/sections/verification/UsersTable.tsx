import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  ShieldCheck, 
  ShieldOff, 
  Building, 
  Key, 
  Trash2 
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { User } from "./hooks/useAllUsers";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface UsersTableProps {
  users: User[];
  onSelectAll?: (selected: boolean) => void;
  onSelectUser?: (userId: string, selected: boolean) => void;
  selectedUsers?: string[];
  onUpdateStatus: (userId: string, status: 'active' | 'inactive') => void;
  onUpdateRole: (userId: string, isAdmin: boolean) => void;
  onDeleteUser: (userId: string) => void;
  onAssignRooms: (userId: string) => void;
  onAssignKeys: (userId: string) => void;
  selectable?: boolean;
}

export function UsersTable({
  users,
  onSelectAll,
  onSelectUser,
  selectedUsers = [],
  onUpdateStatus,
  onUpdateRole,
  onDeleteUser,
  onAssignRooms,
  onAssignKeys,
  selectable = false
}: UsersTableProps) {
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Debug log for users prop
  useEffect(() => {
    console.log("UsersTable received users:", users);
  }, [users]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;
    
    switch (sortColumn) {
      case "name":
        const aName = `${a.profile?.first_name || ''} ${a.profile?.last_name || ''}`.trim();
        const bName = `${b.profile?.first_name || ''} ${b.profile?.last_name || ''}`.trim();
        return aName.localeCompare(bName) * direction;
      case "email":
        return (a.email || '').localeCompare(b.email || '') * direction;
      case "department":
        return (a.profile?.department || '').localeCompare(b.profile?.department || '') * direction;
      case "created":
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * direction;
      case "lastSignIn":
        const aTime = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
        const bTime = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
        return (aTime - bTime) * direction;
      default:
        return 0;
    }
  });

  // Debug log for sorted users
  useEffect(() => {
    console.log("UsersTable sortedUsers:", sortedUsers);
  }, [sortedUsers]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRoleBadge = (isAdmin: boolean) => {
    return isAdmin 
      ? <Badge className="bg-purple-500">Admin</Badge>
      : <Badge variant="outline">User</Badge>;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-12">
                <Checkbox
                  checked={users.length > 0 && selectedUsers.length === users.length}
                  onCheckedChange={onSelectAll}
                  aria-label="Select all users"
                />
              </TableHead>
            )}
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center">
                Name
                {sortColumn === "name" && (
                  <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("email")}
            >
              <div className="flex items-center">
                Email
                {sortColumn === "email" && (
                  <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("department")}
            >
              <div className="flex items-center">
                Department
                {sortColumn === "department" && (
                  <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("created")}
            >
              <div className="flex items-center">
                Created
                {sortColumn === "created" && (
                  <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("lastSignIn")}
            >
              <div className="flex items-center">
                Last Sign In
                {sortColumn === "lastSignIn" && (
                  <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </div>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedUsers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={selectable ? 9 : 8} className="text-center py-6 text-muted-foreground">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            sortedUsers.map((user) => (
              <TableRow 
                key={user.id}
                className={cn(
                  selectedUsers.includes(user.id) && "bg-muted/50"
                )}
              >
                {selectable && (
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => onSelectUser?.(user.id, !!checked)}
                      aria-label={`Select ${user.profile?.first_name || ''} ${user.profile?.last_name || ''}`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">
                  {user.profile 
                    ? `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim() || '-' 
                    : '-'}
                </TableCell>
                <TableCell>{user.email || '-'}</TableCell>
                <TableCell>{user.profile?.department || '-'}</TableCell>
                <TableCell>
                  {format(new Date(user.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  {user.last_sign_in_at 
                    ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy')
                    : 'Never'}
                </TableCell>
                <TableCell>
                  {getStatusBadge(user.status)}
                </TableCell>
                <TableCell>
                  {getRoleBadge(user.is_admin)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {/* Status actions */}
                      {user.status === 'active' ? (
                        <DropdownMenuItem onClick={() => onUpdateStatus(user.id, 'inactive')}>
                          <UserX className="mr-2 h-4 w-4" />
                          <span>Deactivate User</span>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onUpdateStatus(user.id, 'active')}>
                          <UserCheck className="mr-2 h-4 w-4" />
                          <span>Activate User</span>
                        </DropdownMenuItem>
                      )}
                      
                      {/* Role actions */}
                      {user.is_admin ? (
                        <DropdownMenuItem onClick={() => onUpdateRole(user.id, false)}>
                          <ShieldOff className="mr-2 h-4 w-4" />
                          <span>Remove Admin</span>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onUpdateRole(user.id, true)}>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          <span>Make Admin</span>
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      
                      {/* Assignment actions */}
                      <DropdownMenuItem onClick={() => onAssignRooms(user.id)}>
                        <Building className="mr-2 h-4 w-4" />
                        <span>Assign Rooms</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAssignKeys(user.id)}>
                        <Key className="mr-2 h-4 w-4" />
                        <span>Assign Keys</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {/* Delete action */}
                      <DropdownMenuItem 
                        onClick={() => onDeleteUser(user.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete User</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

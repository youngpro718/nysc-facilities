
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { StatusBadge } from "./StatusBadge";
import { TableActions } from "./components/TableActions";
import { AdminToggle } from "./components/AdminToggle";
import { SelectedUser } from "./hooks/useVerificationState";
import { VerificationRequest } from "./hooks/types";

interface VerificationTableProps {
  requests: VerificationRequest[];
  selectedUsers: SelectedUser[];
  onSelectAll: (selected: boolean) => void;
  onSelectOne: (requestId: string, userId: string, name: string, selected: boolean) => void;
  onVerify: (id: string, approved: boolean) => void;
  onAssignRooms: (userId: string) => void;
  onAssignKeys: (userId: string) => void;
  onToggleAdmin: (userId: string, isAdmin: boolean) => void;
  onDeleteUser?: (userId: string) => void;
}

export function VerificationTable({
  requests,
  selectedUsers,
  onSelectAll,
  onSelectOne,
  onVerify,
  onAssignRooms,
  onAssignKeys,
  onToggleAdmin,
  onDeleteUser
}: VerificationTableProps) {
  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={pendingRequests.length > 0 && selectedUsers.length === pendingRequests.length}
              onCheckedChange={onSelectAll}
              aria-label="Select all pending requests"
            />
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Admin</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests?.map((request) => (
          <TableRow 
            key={request.id}
            data-state={selectedUsers.some(u => u.requestId === request.id) ? "selected" : undefined}
          >
            <TableCell>
              {request.status === 'pending' && (
                <Checkbox
                  checked={selectedUsers.some(u => u.requestId === request.id)}
                  onCheckedChange={(checked) => onSelectOne(
                    request.id, 
                    request.user_id,
                    `${request.profile?.first_name || ''} ${request.profile?.last_name || ''}`.trim(),
                    checked as boolean
                  )}
                  aria-label={`Select ${request.profile?.first_name || ''} ${request.profile?.last_name || ''}`}
                />
              )}
            </TableCell>
            <TableCell>
              {request.profile ? 
                `${request.profile.first_name || ''} ${request.profile.last_name || ''}`.trim() || '-' 
                : '-'}
            </TableCell>
            <TableCell>{request.profile?.email || '-'}</TableCell>
            <TableCell>
              {format(new Date(request.submitted_at), 'MMM d, yyyy')}
            </TableCell>
            <TableCell>
              <StatusBadge status={request.status} />
            </TableCell>
            <TableCell>
              <AdminToggle
                isAdmin={request.is_admin}
                userId={request.user_id}
                status={request.status}
                onToggleAdmin={onToggleAdmin}
              />
            </TableCell>
            <TableCell>
              <TableActions
                status={request.status}
                userId={request.user_id}
                requestId={request.id}
                onVerify={onVerify}
                onAssignRooms={onAssignRooms}
                onAssignKeys={onAssignKeys}
                onDeleteUser={onDeleteUser}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

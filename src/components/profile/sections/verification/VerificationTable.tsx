
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Building, Check, Key, X } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "./StatusBadge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Department {
  id: string;
  name: string;
}

interface VerificationRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  profile: {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
  is_admin?: boolean;
}

interface VerificationTableProps {
  requests: VerificationRequest[] | undefined;
  departments: Department[] | undefined;
  selectedOccupants: string[];
  selectedDepartment: string | null;
  onSelectAll: (selected: boolean) => void;
  onSelectOne: (id: string, selected: boolean) => void;
  onDepartmentChange: (id: string) => void;
  onVerify: (id: string, approved: boolean) => void;
  onAssignRooms: (userId: string) => void;
  onAssignKeys: (userId: string) => void;
  onToggleAdmin: (userId: string, isAdmin: boolean) => void;
}

export function VerificationTable({
  requests,
  selectedOccupants,
  onSelectAll,
  onSelectOne,
  onVerify,
  onAssignRooms,
  onAssignKeys,
  onToggleAdmin
}: VerificationTableProps) {
  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <input
              type="checkbox"
              checked={pendingRequests.length > 0 && selectedOccupants.length === pendingRequests.length}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="rounded border-input"
            />
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Room Assignment</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Admin</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests?.map((request) => (
          <TableRow key={request.id}>
            <TableCell>
              {request.status === 'pending' && (
                <input
                  type="checkbox"
                  checked={selectedOccupants.includes(request.id)}
                  onChange={(e) => onSelectOne(request.id, e.target.checked)}
                  className="rounded border-input"
                />
              )}
            </TableCell>
            <TableCell>
              {request.profile ? 
                `${request.profile.first_name || ''} ${request.profile.last_name || ''}`.trim() || '-' 
                : '-'}
            </TableCell>
            <TableCell>
              {request.status === 'pending' ? (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onAssignRooms(request.user_id)}
                >
                  <Building className="h-4 w-4 mr-1" />
                  Assign Room
                </Button>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell>
              {format(new Date(request.submitted_at), 'MMM d, yyyy')}
            </TableCell>
            <TableCell>
              <StatusBadge status={request.status} />
            </TableCell>
            <TableCell>
              <Switch
                checked={request.is_admin || false}
                onCheckedChange={(checked) => {
                  onToggleAdmin(request.user_id, checked);
                  toast.success(`User ${checked ? 'promoted to' : 'removed from'} admin role`);
                }}
              />
            </TableCell>
            <TableCell>
              {request.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onVerify(request.id, true)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onVerify(request.id, false)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
              {request.status === 'approved' && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onAssignRooms(request.user_id)}
                  >
                    <Building className="h-4 w-4 mr-1" />
                    Assign Rooms
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onAssignKeys(request.user_id)}
                  >
                    <Key className="h-4 w-4 mr-1" />
                    Assign Keys
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}


import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Building, Building2, Check, Key, X } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "./StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Department {
  id: string;
  name: string;
}

interface Profile {
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  department_id: string | null;
}

interface VerificationRequest {
  id: string;
  user_id: string;
  department_id: string | null;
  employee_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  profile: Profile | null;
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
}

export function VerificationTable({
  requests,
  departments,
  selectedOccupants,
  selectedDepartment,
  onSelectAll,
  onSelectOne,
  onDepartmentChange,
  onVerify,
  onAssignRooms,
  onAssignKeys,
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
          <TableHead>Employee ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead>Status</TableHead>
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
            <TableCell>{request.employee_id || '-'}</TableCell>
            <TableCell>
              {request.profile ? 
                `${request.profile.first_name || ''} ${request.profile.last_name || ''}`.trim() || '-' 
                : '-'}
            </TableCell>
            <TableCell>
              {request.status === 'pending' ? (
                <Select
                  value={request.department_id || ''}
                  onValueChange={onDepartmentChange}
                >
                  <SelectTrigger className="w-[200px]">
                    <Building className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                departments?.find(d => d.id === request.department_id)?.name || '-'
              )}
            </TableCell>
            <TableCell>
              {format(new Date(request.submitted_at), 'MMM d, yyyy')}
            </TableCell>
            <TableCell>
              <StatusBadge status={request.status} />
            </TableCell>
            <TableCell>
              {request.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onVerify(request.id, true)}
                    disabled={!selectedDepartment}
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
                    <Building2 className="h-4 w-4 mr-1" />
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

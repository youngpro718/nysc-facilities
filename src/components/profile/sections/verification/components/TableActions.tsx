
import { Button } from "@/components/ui/button";
import { Building, Check, Key, Trash2, X } from "lucide-react";

interface TableActionsProps {
  status: 'pending' | 'approved' | 'rejected';
  userId: string;
  requestId: string;
  onVerify: (id: string, approved: boolean) => void;
  onAssignRooms: (userId: string) => void;
  onAssignKeys: (userId: string) => void;
  onDeleteUser?: (userId: string) => void;
}

export function TableActions({
  status,
  userId,
  requestId,
  onVerify,
  onAssignRooms,
  onAssignKeys,
  onDeleteUser
}: TableActionsProps) {
  return (
    <div className="flex gap-2">
      {status === 'pending' && (
        <>
          <Button
            size="sm"
            onClick={() => onVerify(requestId, true)}
          >
            <Check className="h-4 w-4 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onVerify(requestId, false)}
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </>
      )}
      {status === 'approved' && (
        <>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onAssignRooms(userId)}
          >
            <Building className="h-4 w-4 mr-1" />
            Assign Rooms
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onAssignKeys(userId)}
          >
            <Key className="h-4 w-4 mr-1" />
            Assign Keys
          </Button>
        </>
      )}
      {onDeleteUser && (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDeleteUser(userId)}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      )}
    </div>
  );
}

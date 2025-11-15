
import { Button } from "@/components/ui/button";
import { Check, Trash2, X } from "lucide-react";
import { PostVerificationActions } from "./PostVerificationActions";
import { VerificationRequest } from "../hooks/types";

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
        <PostVerificationActions
          request={{ user_id: userId, id: requestId, status: 'approved' } as VerificationRequest}
          onAssignRooms={onAssignRooms}
          onAssignKeys={onAssignKeys}
        />
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

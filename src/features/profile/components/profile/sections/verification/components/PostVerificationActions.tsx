
import { Button } from "@/components/ui/button";
import { Building, Key } from "lucide-react";
import { VerificationRequest } from "../hooks/types";

interface PostVerificationActionsProps {
  request: VerificationRequest;
  onAssignRooms: (userId: string) => void;
  onAssignKeys: (userId: string) => void;
}

export function PostVerificationActions({
  request,
  onAssignRooms,
  onAssignKeys,
}: PostVerificationActionsProps) {
  if (request.status !== 'approved') {
    return null;
  }

  return (
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
  );
}

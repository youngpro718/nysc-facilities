
import { Button } from "@/components/ui/button";
import { Building, Key } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostVerificationBarProps {
  selectedCount: number;
  onAssignRooms: () => void;
  onAssignKeys: () => void;
  className?: string;
}

export function PostVerificationBar({
  selectedCount,
  onAssignRooms,
  onAssignKeys,
  className
}: PostVerificationBarProps) {
  return (
    <div className={cn("p-4 bg-secondary rounded-lg flex items-center justify-between", className)}>
      <div>
        <span className="text-sm font-medium block">
          {selectedCount} approved {selectedCount === 1 ? 'user' : 'users'} selected
        </span>
        <span className="text-sm text-muted-foreground">
          Assign rooms or keys to the selected users
        </span>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onAssignRooms}
        >
          <Building className="h-4 w-4 mr-1" />
          Assign Rooms
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onAssignKeys}
        >
          <Key className="h-4 w-4 mr-1" />
          Assign Keys
        </Button>
      </div>
    </div>
  );
}

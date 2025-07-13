
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Shield, ArrowUp, ArrowDown } from "lucide-react";
import { RequestStatus } from "../hooks/types";

interface AdminToggleProps {
  isAdmin: boolean;
  userId: string;
  status: RequestStatus;
  onToggleAdmin: (userId: string, isAdmin: boolean) => void;
}

export function AdminToggle({ isAdmin, userId, status, onToggleAdmin }: AdminToggleProps) {
  const isDisabled = status === 'rejected';

  if (isDisabled) {
    return (
      <span className="text-xs text-muted-foreground">Not available</span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isAdmin ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onToggleAdmin(userId, false)}
          className="border-red-300 text-red-600 hover:bg-red-50 text-xs"
        >
          <ArrowDown className="h-3 w-3 mr-1" />
          Remove Admin
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onToggleAdmin(userId, true)}
          className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs"
        >
          <ArrowUp className="h-3 w-3 mr-1" />
          Make Admin
        </Button>
      )}
    </div>
  );
}


import { Switch } from "@/components/ui/switch";
import { RequestStatus } from "../hooks/types";

interface AdminToggleProps {
  isAdmin: boolean;
  userId: string;
  status: RequestStatus;
  onToggleAdmin: (userId: string, isAdmin: boolean) => void;
}

export function AdminToggle({ isAdmin, userId, status, onToggleAdmin }: AdminToggleProps) {
  const isDisabled = status === 'rejected';

  return (
    <Switch
      checked={isAdmin}
      onCheckedChange={(checked) => onToggleAdmin(userId, checked)}
      disabled={isDisabled}
    />
  );
}

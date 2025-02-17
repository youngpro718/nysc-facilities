
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface AdminToggleProps {
  isAdmin: boolean;
  userId: string;
  status: string;
  onToggleAdmin: (userId: string, isAdmin: boolean) => void;
}

export function AdminToggle({ isAdmin, userId, status, onToggleAdmin }: AdminToggleProps) {
  return (
    <Switch
      checked={isAdmin}
      onCheckedChange={(checked) => {
        onToggleAdmin(userId, checked);
        toast.success(`User ${checked ? 'promoted to' : 'removed from'} admin role`);
      }}
      disabled={status !== 'approved'}
    />
  );
}

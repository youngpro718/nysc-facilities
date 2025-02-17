
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SelectedUser } from "../hooks/useVerificationState";

interface VerificationActionDialogsProps {
  selectedUsers: SelectedUser[];
  setSelectedUsers: (users: SelectedUser[]) => void;
}

export function VerificationActionDialogs({
  selectedUsers,
  setSelectedUsers
}: VerificationActionDialogsProps) {
  return null; // Placeholder for future verification-specific dialogs
}

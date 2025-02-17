
import { VerificationActionDialogs } from "./VerificationActionDialogs";
import { PostVerificationDialogs } from "./PostVerificationDialogs";
import { SelectedUser } from "../hooks/useVerificationState";

interface VerificationDialogsProps {
  showAssignRooms: boolean;
  setShowAssignRooms: (show: boolean) => void;
  showAssignKeys: boolean;
  setShowAssignKeys: (show: boolean) => void;
  selectedUsers: SelectedUser[];
  setSelectedUsers: (users: SelectedUser[]) => void;
}

export function VerificationDialogs(props: VerificationDialogsProps) {
  return (
    <>
      <VerificationActionDialogs
        selectedUsers={props.selectedUsers}
        setSelectedUsers={props.setSelectedUsers}
      />
      <PostVerificationDialogs {...props} />
    </>
  );
}


import { AssignRoomsDialog } from "@/components/occupants/AssignRoomsDialog";
import { AssignKeysDialog } from "@/components/occupants/AssignKeysDialog";
import { SelectedUser } from "../hooks/useVerificationState";

interface PostVerificationDialogsProps {
  showAssignRooms: boolean;
  setShowAssignRooms: (show: boolean) => void;
  showAssignKeys: boolean;
  setShowAssignKeys: (show: boolean) => void;
  selectedUsers: SelectedUser[];
  setSelectedUsers: (users: SelectedUser[]) => void;
}

export function PostVerificationDialogs({
  showAssignRooms,
  setShowAssignRooms,
  showAssignKeys,
  setShowAssignKeys,
  selectedUsers,
  setSelectedUsers
}: PostVerificationDialogsProps) {
  const verifiedUserIds = selectedUsers.map(u => u.userId);

  return (
    <>
      <AssignRoomsDialog
        open={showAssignRooms}
        onOpenChange={setShowAssignRooms}
        selectedOccupants={verifiedUserIds}
        onSuccess={() => {
          setShowAssignRooms(false);
          setSelectedUsers([]);
        }}
      />

      <AssignKeysDialog
        open={showAssignKeys}
        onOpenChange={setShowAssignKeys}
        selectedOccupants={verifiedUserIds}
        onSuccess={() => {
          setShowAssignKeys(false);
          setSelectedUsers([]);
        }}
      />
    </>
  );
}

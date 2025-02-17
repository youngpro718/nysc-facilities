
import { AssignRoomsDialog } from "@/components/occupants/AssignRoomsDialog";
import { AssignKeysDialog } from "@/components/occupants/AssignKeysDialog";
import { SelectedUser } from "../hooks/useVerificationState";

interface VerificationDialogsProps {
  showAssignRooms: boolean;
  setShowAssignRooms: (show: boolean) => void;
  showAssignKeys: boolean;
  setShowAssignKeys: (show: boolean) => void;
  selectedUsers: SelectedUser[];
  setSelectedUsers: (users: SelectedUser[]) => void;
}

export function VerificationDialogs({
  showAssignRooms,
  setShowAssignRooms,
  showAssignKeys,
  setShowAssignKeys,
  selectedUsers,
  setSelectedUsers
}: VerificationDialogsProps) {
  return (
    <>
      <AssignRoomsDialog
        open={showAssignRooms}
        onOpenChange={setShowAssignRooms}
        selectedOccupants={selectedUsers.map(u => u.userId)}
        onSuccess={() => {
          setShowAssignRooms(false);
          setSelectedUsers([]);
        }}
      />

      <AssignKeysDialog
        open={showAssignKeys}
        onOpenChange={setShowAssignKeys}
        selectedOccupants={selectedUsers.map(u => u.userId)}
        onSuccess={() => {
          setShowAssignKeys(false);
          setSelectedUsers([]);
        }}
      />
    </>
  );
}

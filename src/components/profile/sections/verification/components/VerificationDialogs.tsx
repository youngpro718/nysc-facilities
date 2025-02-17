
import { AssignRoomsDialog } from "@/components/occupants/AssignRoomsDialog";
import { AssignKeysDialog } from "@/components/occupants/AssignKeysDialog";

interface VerificationDialogsProps {
  showAssignRooms: boolean;
  setShowAssignRooms: (show: boolean) => void;
  showAssignKeys: boolean;
  setShowAssignKeys: (show: boolean) => void;
  selectedUsers: string[];
  setSelectedUsers: (users: string[]) => void;
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
        selectedOccupants={selectedUsers}
        onSuccess={() => {
          setShowAssignRooms(false);
          setSelectedUsers([]);
        }}
      />

      <AssignKeysDialog
        open={showAssignKeys}
        onOpenChange={setShowAssignKeys}
        selectedOccupants={selectedUsers}
        onSuccess={() => {
          setShowAssignKeys(false);
          setSelectedUsers([]);
        }}
      />
    </>
  );
}

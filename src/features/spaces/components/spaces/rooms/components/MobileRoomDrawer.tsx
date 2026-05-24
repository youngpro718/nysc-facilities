import { X } from "lucide-react";
import { Room } from "../types/RoomTypes";
import { RoomCard } from "../RoomCard";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useCourtAssignmentsMap } from "@features/spaces/hooks/queries/useCourtAssignmentsMap";
import { CourtroomAssignmentHeader } from "./CourtroomAssignmentHeader";

interface MobileRoomDrawerProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export function MobileRoomDrawer({
  room,
  isOpen,
  onClose,
  onDelete
}: MobileRoomDrawerProps) {
  const [confirmDeleteRoom, confirmDeleteDialog] = useConfirmDialog();
  const { data: assignmentsByRoomId } = useCourtAssignmentsMap();
  if (!room) return null;

  const assignment =
    room.room_type === "courtroom"
      ? assignmentsByRoomId?.get(room.id) ?? null
      : null;

  return (
    <><Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85dvh]">
        <DrawerHeader className="flex items-center justify-between px-4 py-3">
          <DrawerTitle className="text-base font-semibold truncate">{room.name}</DrawerTitle>
          <DrawerClose asChild>
            <button
              className="p-2 -mr-2 rounded-full text-muted-foreground hover:bg-muted transition-colors touch-manipulation"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </DrawerClose>
        </DrawerHeader>
        <div className="px-3 pb-2 flex flex-col gap-3 h-[75dvh] overflow-y-auto">
          {assignment && <CourtroomAssignmentHeader assignment={assignment} />}
          <RoomCard
            room={room}
            onDelete={onDelete ? async (id) => {
              const ok = await confirmDeleteRoom({ title: 'Delete Room', description: 'Are you sure you want to delete this room? This cannot be undone.', confirmLabel: 'Delete', variant: 'destructive' });
              if (ok) {
                onDelete(id);
                onClose();
              }
            } : undefined}
            variant="panel"
          />
        </div>
      </DrawerContent>
    </Drawer>
    {confirmDeleteDialog}
    </>
  );
}

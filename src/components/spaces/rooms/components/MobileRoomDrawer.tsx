import { Room } from "../types/RoomTypes";
import { RoomCard } from "../RoomCard";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface MobileRoomDrawerProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function MobileRoomDrawer({
  room,
  isOpen,
  onClose,
  onDelete
}: MobileRoomDrawerProps) {
  if (!room) return null;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[92dvh] flex flex-col">
        <DrawerHeader className="sr-only">
          <DrawerTitle>{room.name}</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 min-h-0 overflow-y-auto p-2 pb-safe">
          <RoomCard
            room={room}
            onDelete={(id) => {
              if (window.confirm('Are you sure you want to delete this room?')) {
                onDelete(id);
                onClose();
              }
            }}
            variant="panel"
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

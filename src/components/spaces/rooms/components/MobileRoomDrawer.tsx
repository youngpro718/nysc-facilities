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
        <div className="p-2 h-[75dvh] overflow-hidden">
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

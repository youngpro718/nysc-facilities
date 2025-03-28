import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoomInventory } from '../RoomInventory';

interface RoomInventoryDialogProps {
  roomId: string;
  roomName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoomInventoryDialog({
  roomId,
  roomName,
  open,
  onOpenChange,
}: RoomInventoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Inventory for {roomName}</DialogTitle>
        </DialogHeader>
        <div className="h-[calc(90vh-8rem)] overflow-hidden">
          <RoomInventory roomId={roomId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoomInventory } from "../../RoomInventory";

interface InventoryDialogEvent extends CustomEvent {
  detail: {
    roomId: string;
    roomName: string;
  };
}

export function MobileInventoryDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [roomData, setRoomData] = useState<{ roomId: string; roomName: string } | null>(null);

  useEffect(() => {
    const handleInventoryOpen = (event: InventoryDialogEvent) => {
      setRoomData(event.detail);
      setIsOpen(true);
    };

    window.addEventListener('openInventoryDialog', handleInventoryOpen as EventListener);
    
    return () => {
      window.removeEventListener('openInventoryDialog', handleInventoryOpen as EventListener);
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>
            Inventory for {roomData?.roomName || 'Storage Room'}
          </DialogTitle>
        </DialogHeader>
        <div className="h-[calc(90vh-8rem)] overflow-hidden px-6 pb-6">
          {roomData && <RoomInventory roomId={roomData.roomId} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MobileRoomInventory } from "../../inventory/components/MobileRoomInventory";

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
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] h-[90vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-0 shrink-0">
          <DialogTitle className="text-base">
            {roomData?.roomName || 'Storage Room'} - Inventory
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {roomData && <MobileRoomInventory roomId={roomData.roomId} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
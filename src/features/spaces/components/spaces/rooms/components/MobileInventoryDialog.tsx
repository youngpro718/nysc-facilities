import React, { useState, useEffect } from 'react';
import { ModalFrame } from "@shared/components/common/common/ModalFrame";
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
    <ModalFrame
      open={isOpen}
      onOpenChange={setIsOpen}
      size="md"
      title={`${roomData?.roomName || 'Storage Room'} - Inventory`}
      className="max-h-[90vh]"
    >
      <div className="flex-1 overflow-hidden -mx-4 sm:-mx-6 -my-4 sm:-my-6">
        {roomData && <MobileRoomInventory roomId={roomData.roomId} />}
      </div>
    </ModalFrame>
  );
}
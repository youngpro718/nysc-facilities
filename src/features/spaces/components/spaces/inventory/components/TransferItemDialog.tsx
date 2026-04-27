
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { DialogFooter } from "@/components/ui/dialog";
import { ModalFrame } from "@shared/components/common/common/ModalFrame";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InventoryItem } from "../types/inventoryTypes";
import { useInventoryTransfer } from "../hooks/useInventoryTransfer";

interface TransferItemDialogProps {
  item: InventoryItem;
  currentRoomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferItemDialog({
  item,
  currentRoomId,
  open,
  onOpenChange,
}: TransferItemDialogProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const { transferItem, isTransferring } = useInventoryTransfer();

  const { data: rooms } = useQuery({
    queryKey: ['rooms-for-transfer', currentRoomId],
    queryFn: async () => {
      const { data } = await supabase
        .from('rooms')
        .select('id, name, room_number, floor_id, floors:floor_id(name, buildings:building_id(name))')
        .eq('status', 'active')
        .neq('id', currentRoomId)
        .order('name');
      return data || [];
    },
    enabled: open,
  });

  const handleTransfer = async () => {
    if (!selectedRoomId) return;
    await transferItem({
      itemId: item.id,
      itemName: item.name,
      fromRoomId: currentRoomId,
      toRoomId: selectedRoomId,
      quantity: item.quantity,
      notes: notes || undefined,
    });
    setSelectedRoomId("");
    setNotes("");
    onOpenChange(false);
  };

  const getRoomLabel = (room: any) => {
    const building = room.floors?.buildings?.name || "";
    const floor = room.floors?.name || "";
    const name = room.name || room.room_number || room.id;
    const parts = [building, floor, name].filter(Boolean);
    return parts.join(" > ");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transfer Item</DialogTitle>
          <DialogDescription>
            Move <strong>{item.name}</strong> to a different room.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="destination-room">Destination Room</Label>
            <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
              <SelectTrigger id="destination-room">
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {rooms?.map((room: any) => (
                  <SelectItem key={room.id} value={room.id}>
                    {getRoomLabel(room)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="transfer-notes">Notes (optional)</Label>
            <Textarea
              id="transfer-notes"
              placeholder="Reason for transfer..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isTransferring}>
            Cancel
          </Button>
          <Button onClick={handleTransfer} disabled={!selectedRoomId || isTransferring}>
            {isTransferring ? "Transferring..." : "Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

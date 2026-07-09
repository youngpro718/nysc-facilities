
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

interface BulkTransferDialogProps {
  items: InventoryItem[];
  currentRoomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferred?: () => void;
}

export function BulkTransferDialog({
  items,
  currentRoomId,
  open,
  onOpenChange,
  onTransferred,
}: BulkTransferDialogProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const { transferBulkItems, isBulkTransferring } = useInventoryTransfer();

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
    if (!selectedRoomId || items.length === 0) return;
    await transferBulkItems({
      items: items.map(item => ({ id: item.id, name: item.name, quantity: item.quantity })),
      fromRoomId: currentRoomId,
      toRoomId: selectedRoomId,
      notes: notes || undefined,
    });
    setSelectedRoomId("");
    setNotes("");
    onOpenChange(false);
    onTransferred?.();
  };

  const getRoomLabel = (room: any) => {
    const building = room.floors?.buildings?.name || "";
    const floor = room.floors?.name || "";
    const name = room.name || room.room_number || room.id;
    const parts = [building, floor, name].filter(Boolean);
    return parts.join(" > ");
  };

  return (
    <ModalFrame
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title="Transfer Items"
      description={<>Move <strong>{items.length} item{items.length === 1 ? '' : 's'}</strong> to a different room.</>}
    >
        <div className="grid gap-4 py-4">
          <div className="max-h-32 overflow-y-auto rounded-md border p-2 text-sm text-muted-foreground">
            {items.map(item => (
              <div key={item.id} className="truncate">
                {item.name} <span className="tabular-nums">({item.quantity})</span>
              </div>
            ))}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bulk-destination-room">Destination Room</Label>
            <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
              <SelectTrigger id="bulk-destination-room">
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
            <Label htmlFor="bulk-transfer-notes">Notes (optional)</Label>
            <Textarea
              id="bulk-transfer-notes"
              placeholder="Reason for transfer..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isBulkTransferring}>
            Cancel
          </Button>
          <Button onClick={handleTransfer} disabled={!selectedRoomId || isBulkTransferring}>
            {isBulkTransferring ? "Transferring..." : `Transfer ${items.length} item${items.length === 1 ? '' : 's'}`}
          </Button>
        </DialogFooter>
    </ModalFrame>
  );
}

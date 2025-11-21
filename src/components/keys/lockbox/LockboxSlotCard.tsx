import { Badge } from "@/components/ui/badge";
import { LockboxSlot } from "../types/LockboxTypes";
import { Key, AlertTriangle, CheckCircle, Archive } from "lucide-react";

interface LockboxSlotCardProps {
  slot: LockboxSlot;
  onClick: (slot: LockboxSlot) => void;
  lockboxName?: string;
  lockboxLocation?: string;
}

export function LockboxSlotCard({ slot, onClick, lockboxName, lockboxLocation }: LockboxSlotCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_box':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> In Box</Badge>;
      case 'checked_out':
        return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600"><Key className="w-3 h-3 mr-1" /> Checked Out</Badge>;
      case 'missing':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Missing</Badge>;
      case 'retired':
        return <Badge variant="secondary"><Archive className="w-3 h-3 mr-1" /> Retired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div 
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => onClick(slot)}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-full font-bold text-lg">
          {slot.slot_number}
        </div>
        <div>
          <h4 className="font-bold text-base">{slot.label}</h4>
          <div className="text-sm text-muted-foreground flex gap-2">
            {slot.room_number && <span>Room: {slot.room_number}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {getStatusBadge(slot.status)}
      </div>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { LockboxSlot, getRoomLinkStatus } from "../types/LockboxTypes";
import { Key, AlertTriangle, CheckCircle, Archive, Link2, Link2Off, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";

interface LockboxSlotCardProps {
  slot: LockboxSlot;
  onClick: (slot: LockboxSlot) => void;
  lockboxName?: string;
  lockboxLocation?: string;
}

function getStatusBorderColor(status: string) {
  switch (status) {
    case 'in_box': return 'border-l-green-500';
    case 'checked_out': return 'border-l-orange-500';
    case 'missing': return 'border-l-destructive';
    case 'retired': return 'border-l-muted-foreground/40';
    default: return 'border-l-border';
  }
}

export function LockboxSlotCard({ slot, onClick, lockboxName, lockboxLocation }: LockboxSlotCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_box':
        return <Badge className="bg-green-500 hover:bg-green-600 text-xs"><CheckCircle className="w-3 h-3 mr-1" /> In Box</Badge>;
      case 'checked_out':
        return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600 text-xs"><Key className="w-3 h-3 mr-1" /> Out</Badge>;
      case 'missing':
        return <Badge variant="destructive" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" /> Missing</Badge>;
      case 'retired':
        return <Badge variant="secondary" className="text-xs"><Archive className="w-3 h-3 mr-1" /> Retired</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const roomLinkStatus = getRoomLinkStatus(slot);

  const getRoomLinkIndicator = () => {
    switch (roomLinkStatus) {
      case 'linked':
        return (
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <Link2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline text-xs">Linked</span>
          </span>
        );
      case 'unlinked':
        return (
          <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
            <Link2Off className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs">Unlinked</span>
          </span>
        );
      case 'no_room':
        return (
          <span className="flex items-center gap-1 text-muted-foreground">
            <CircleDashed className="w-3.5 h-3.5 shrink-0" />
          </span>
        );
    }
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-3 sm:p-4 border rounded-xl hover:bg-muted/50 cursor-pointer transition-colors active:scale-[0.99] touch-manipulation",
        "border-l-4",
        getStatusBorderColor(slot.status)
      )}
      onClick={() => onClick(slot)}
    >
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className="flex items-center justify-center w-10 h-10 sm:w-10 sm:h-10 bg-muted rounded-full font-bold text-base sm:text-lg shrink-0">
          {slot.slot_number}
        </div>
        <div className="min-w-0">
          <h4 className="font-semibold text-sm sm:text-base truncate">{slot.label}</h4>
          <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {(slot.room_number || slot.room_id) && (
              <>
                {getRoomLinkIndicator()}
                <span className="truncate">Room {slot.room_number || 'Linked'}</span>
              </>
            )}
            {!slot.room_number && !slot.room_id && (
              <span className="text-muted-foreground/60 italic">No room</span>
            )}
            {slot.quantity && slot.quantity > 1 && (
              <span className="text-primary font-semibold">
                ×{slot.quantity}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center shrink-0 ml-2">
        {getStatusBadge(slot.status)}
      </div>
    </div>
  );
}

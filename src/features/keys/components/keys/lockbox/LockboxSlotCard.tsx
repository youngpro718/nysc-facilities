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

function getStatusConfig(status: string) {
  switch (status) {
    case 'in_box': return { border: 'border-l-green-500', bg: 'bg-green-50/50 dark:bg-green-950/10', label: 'Available' };
    case 'checked_out': return { border: 'border-l-orange-500', bg: 'bg-orange-50/50 dark:bg-orange-950/10', label: 'Checked Out' };
    case 'missing': return { border: 'border-l-destructive', bg: 'bg-red-50/50 dark:bg-red-950/10', label: 'Missing' };
    case 'retired': return { border: 'border-l-muted-foreground/40', bg: 'bg-muted/30', label: 'Retired' };
    default: return { border: 'border-l-border', bg: '', label: status };
  }
}

export function LockboxSlotCard({ slot, onClick }: LockboxSlotCardProps) {
  const statusConfig = getStatusConfig(slot.status);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_box':
        return <Badge className="bg-green-500 hover:bg-green-600 text-xs"><CheckCircle className="w-3 h-3 mr-1" /> Available</Badge>;
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
        statusConfig.border,
        statusConfig.bg
      )}
      onClick={() => onClick(slot)}
    >
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className={cn(
          "flex items-center justify-center w-10 h-10 sm:w-10 sm:h-10 rounded-full font-bold text-base sm:text-lg shrink-0",
          slot.status === 'in_box' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
          slot.status === 'checked_out' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
          slot.status === 'missing' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
          'bg-muted'
        )}>
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

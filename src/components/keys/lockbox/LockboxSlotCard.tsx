import { Badge } from "@/components/ui/badge";
import { LockboxSlot, getRoomLinkStatus } from "../types/LockboxTypes";
import { Key, AlertTriangle, CheckCircle, Archive, Link2, Link2Off, CircleDashed } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  const roomLinkStatus = getRoomLinkStatus(slot);

  const getRoomLinkIndicator = () => {
    switch (roomLinkStatus) {
      case 'linked':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-green-600 dark:text-green-500">
                  <Link2 className="w-3.5 h-3.5" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Linked to room in database</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'unlinked':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500">
                  <Link2Off className="w-3.5 h-3.5" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Room not linked - click to fix</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'no_room':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <CircleDashed className="w-3.5 h-3.5" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>No room assigned</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
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
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            {(slot.room_number || slot.room_id) && (
              <>
                {getRoomLinkIndicator()}
                <span>Room: {slot.room_number || 'Linked'}</span>
              </>
            )}
            {!slot.room_number && !slot.room_id && (
              <span className="text-muted-foreground/60 italic">No room</span>
            )}
            {slot.quantity && slot.quantity > 1 && (
              <span className="text-primary font-semibold">
                × {slot.quantity} keys
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {getStatusBadge(slot.status)}
      </div>
    </div>
  );
}

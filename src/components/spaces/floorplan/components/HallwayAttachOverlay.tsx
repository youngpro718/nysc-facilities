
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Link2, X, ChevronLeft, ChevronRight, Unlink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  fetchAttachedRoomsForHallway,
  attachRoomToHallway,
  detachRoomFromHallway,
} from '../queries/floorPlanQueries';

interface AttachedRoom {
  id: string;
  hallway_id: string;
  room_id: string;
  position: string;
  side: string;
  sequence_order: number;
  room_name: string;
  room_number: string;
}

interface HallwayAttachOverlayProps {
  hallwayId: string;
  hallwayName: string;
  selectedRoomId?: string | null;
  selectedRoomName?: string;
  selectedRoomType?: string;
  onClose: () => void;
  onRefresh?: () => void;
}

const SLOT_POSITIONS = ['start', 'middle', 'end'] as const;
const SIDES = ['left', 'right'] as const;

export function HallwayAttachOverlay({
  hallwayId,
  hallwayName,
  selectedRoomId,
  selectedRoomName,
  selectedRoomType,
  onClose,
  onRefresh,
}: HallwayAttachOverlayProps) {
  const [attachedRooms, setAttachedRooms] = useState<AttachedRoom[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const rooms = await fetchAttachedRoomsForHallway(hallwayId);
      setAttachedRooms(rooms.sort((a, b) => a.sequence_order - b.sequence_order));
    } finally {
      setLoading(false);
    }
  }, [hallwayId]);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  const handleSlotClick = async (side: string, position: string) => {
    if (!selectedRoomId || selectedRoomType === 'hallway' || selectedRoomType === 'door') {
      toast.info('Select a room in the 3D view first, then click a slot to place it.');
      return;
    }

    // Check if room is already attached
    const existing = attachedRooms.find(r => r.room_id === selectedRoomId);
    if (existing) {
      toast.error('This room is already attached to this hallway.');
      return;
    }

    try {
      await attachRoomToHallway({
        hallway_id: hallwayId,
        room_id: selectedRoomId,
        position,
        side,
        sequence_order: attachedRooms.length,
      });
      toast.success(`${selectedRoomName || 'Room'} attached to ${side} side`);
      loadRooms();
      onRefresh?.();
    } catch {
      toast.error('Failed to attach room');
    }
  };

  const handleDetach = async (attachmentId: string) => {
    try {
      await detachRoomFromHallway(attachmentId);
      toast.success('Room detached');
      loadRooms();
      onRefresh?.();
    } catch {
      toast.error('Failed to detach');
    }
  };

  const getRoomsOnSlot = (side: string, position: string) =>
    attachedRooms.filter(r => r.side === side && r.position === position);

  return (
    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-xl">
      <div className="bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-2xl p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {hallwayName || 'Hallway'} — Room Placement
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Instruction */}
        {selectedRoomId && selectedRoomType !== 'hallway' ? (
          <p className="text-xs text-primary mb-2">
            Click a slot below to place <strong>{selectedRoomName || 'selected room'}</strong>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mb-2">
            Select a room in the 3D view, then click a slot to attach it.
          </p>
        )}

        {/* Hallway Strip */}
        <div className="space-y-1">
          {/* Left side slots */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">Left</span>
            <div className="flex-1 flex gap-1">
              {SLOT_POSITIONS.map(pos => {
                const rooms = getRoomsOnSlot('left', pos);
                return (
                  <button
                    key={`left-${pos}`}
                    onClick={() => handleSlotClick('left', pos)}
                    className={cn(
                      "flex-1 h-10 rounded-md border-2 border-dashed transition-all text-[10px] flex flex-col items-center justify-center gap-0.5",
                      rooms.length > 0
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-muted-foreground/20 bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    {rooms.length > 0 ? (
                      rooms.map(r => (
                        <div key={r.id} className="flex items-center gap-0.5">
                          <span className="truncate max-w-[60px]">{r.room_number || r.room_name || '…'}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDetach(r.id); }}
                            className="hover:text-destructive"
                          >
                            <Unlink className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <span>{pos}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hallway bar */}
          <div className="flex items-center gap-1">
            <span className="w-8 shrink-0" />
            <div className="flex-1 h-6 rounded bg-accent/30 border border-accent/50 flex items-center justify-center">
              <span className="text-[10px] font-medium text-accent-foreground/70 tracking-wider uppercase">
                {hallwayName || 'Hallway'}
              </span>
            </div>
          </div>

          {/* Right side slots */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">Right</span>
            <div className="flex-1 flex gap-1">
              {SLOT_POSITIONS.map(pos => {
                const rooms = getRoomsOnSlot('right', pos);
                return (
                  <button
                    key={`right-${pos}`}
                    onClick={() => handleSlotClick('right', pos)}
                    className={cn(
                      "flex-1 h-10 rounded-md border-2 border-dashed transition-all text-[10px] flex flex-col items-center justify-center gap-0.5",
                      rooms.length > 0
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-muted-foreground/20 bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    {rooms.length > 0 ? (
                      rooms.map(r => (
                        <div key={r.id} className="flex items-center gap-0.5">
                          <span className="truncate max-w-[60px]">{r.room_number || r.room_name || '…'}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDetach(r.id); }}
                            className="hover:text-destructive"
                          >
                            <Unlink className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <span>{pos}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary */}
        {attachedRooms.length > 0 && (
          <p className="text-[10px] text-muted-foreground mt-2">
            {attachedRooms.length} room{attachedRooms.length !== 1 ? 's' : ''} attached
          </p>
        )}
      </div>
    </div>
  );
}

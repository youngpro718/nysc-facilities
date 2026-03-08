
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Link2, Unlink, Plus, ArrowUpDown, Building2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  fetchAttachedRoomsForHallway,
  fetchHallwayForRoom,
  fetchHallwaysForFloor,
  attachRoomToHallway,
  updateHallwayRoomAttachment,
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

interface RoomHallwayInfo {
  id: string;
  hallway_id: string;
  room_id: string;
  position: string;
  side: string;
  sequence_order: number;
  hallway_name: string;
}

interface HallwayAttachPanelProps {
  selectedObject: {
    id: string;
    type: string;
    object_type?: string;
    name?: string;
    room_number?: string;
    floor_id?: string;
    data?: { properties?: Record<string, unknown> };
  };
  floorId: string;
  onRefresh?: () => void;
  onEnterAttachMode?: (hallwayId: string) => void;
}

const SIDES = ['left', 'right'] as const;
const POSITIONS = ['start', 'middle', 'end'] as const;

// ─── Sortable Room Card ─────────────────────────────────
function SortableRoomCard({ ar, onDetach, onUpdate }: {
  ar: AttachedRoom;
  onDetach: (id: string) => void;
  onUpdate: (id: string, updates: { position?: string; side?: string }) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ar.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className="p-2 rounded-lg border bg-card text-card-foreground space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none p-0.5 text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <span className="text-sm font-medium">{ar.room_number || ar.room_name || ar.room_id.slice(0, 8)}</span>
          <span className="text-[10px] text-muted-foreground">#{ar.sequence_order}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDetach(ar.id)}>
          <Unlink className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Label className="text-[10px] text-muted-foreground">Side</Label>
          <Select value={ar.side} onValueChange={(v) => onUpdate(ar.id, { side: v })}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SIDES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label className="text-[10px] text-muted-foreground">Position</Label>
          <Select value={ar.position} onValueChange={(v) => onUpdate(ar.id, { position: v })}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {POSITIONS.map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

export function HallwayAttachPanel({ selectedObject, floorId, onRefresh, onEnterAttachMode }: HallwayAttachPanelProps) {
  const objectType = selectedObject.object_type || selectedObject.type;
  const isHallway = objectType === 'hallway';
  const isRoom = objectType === 'room' || (!isHallway && objectType !== 'door');

  const [attachedRooms, setAttachedRooms] = useState<AttachedRoom[]>([]);
  const [roomHallwayInfo, setRoomHallwayInfo] = useState<RoomHallwayInfo | null>(null);
  const [hallways, setHallways] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [attachForm, setAttachForm] = useState({ hallway_id: '', side: 'left', position: 'middle', sequence_order: 0 });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isHallway) {
        const rooms = await fetchAttachedRoomsForHallway(selectedObject.id);
        setAttachedRooms(rooms.sort((a, b) => a.sequence_order - b.sequence_order));
      } else if (isRoom) {
        const info = await fetchHallwayForRoom(selectedObject.id);
        setRoomHallwayInfo(info);
        if (!info) {
          const h = await fetchHallwaysForFloor(floorId);
          setHallways(h);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [selectedObject.id, isHallway, isRoom, floorId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDetach = async (attachmentId: string) => {
    try {
      await detachRoomFromHallway(attachmentId);
      toast.success('Room detached from hallway');
      loadData();
      onRefresh?.();
    } catch {
      toast.error('Failed to detach room');
    }
  };

  const handleUpdateAttachment = async (attachmentId: string, updates: { position?: string; side?: string; sequence_order?: number }) => {
    try {
      await updateHallwayRoomAttachment(attachmentId, updates);
      loadData();
      onRefresh?.();
    } catch {
      toast.error('Failed to update attachment');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = attachedRooms.findIndex(r => r.id === active.id);
    const newIndex = attachedRooms.findIndex(r => r.id === over.id);
    const reordered = arrayMove(attachedRooms, oldIndex, newIndex);

    // Optimistic update
    setAttachedRooms(reordered);

    // Persist new sequence_order for all reordered items
    try {
      await Promise.all(
        reordered.map((room, idx) =>
          updateHallwayRoomAttachment(room.id, { sequence_order: idx })
        )
      );
      toast.success('Room order updated');
      onRefresh?.();
    } catch {
      toast.error('Failed to reorder rooms');
      loadData(); // rollback
    }
  };

  const handleAttachRoom = async () => {
    if (!attachForm.hallway_id) {
      toast.error('Select a hallway first');
      return;
    }
    try {
      await attachRoomToHallway({
        hallway_id: attachForm.hallway_id,
        room_id: selectedObject.id,
        position: attachForm.position,
        side: attachForm.side,
        sequence_order: attachForm.sequence_order,
      });
      toast.success('Room attached to hallway');
      loadData();
      onRefresh?.();
    } catch {
      toast.error('Failed to attach room');
    }
  };

  if (loading) {
    return <div className="p-3 text-sm text-muted-foreground">Loading attachments…</div>;
  }

  // ─── Hallway selected ─────────────────────────────────
  if (isHallway) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Attached Rooms ({attachedRooms.length})</span>
        </div>

        {attachedRooms.length === 0 ? (
          <p className="text-xs text-muted-foreground">No rooms attached to this hallway.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={attachedRooms.map(r => r.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {attachedRooms.map((ar) => (
                  <SortableRoomCard
                    key={ar.id}
                    ar={ar}
                    onDetach={handleDetach}
                    onUpdate={handleUpdateAttachment}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <Separator />
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <ArrowUpDown className="h-3 w-3" />
          Drag rooms to reorder. Select a room in the view to attach it.
        </p>
        {onEnterAttachMode && (
          <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => onEnterAttachMode(selectedObject.id)}>
            <Plus className="h-3 w-3 mr-1" /> Enter Attach Mode
          </Button>
        )}
      </div>
    );
  }

  // ─── Room selected ────────────────────────────────────
  if (isRoom) {
    if (roomHallwayInfo) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Hallway Assignment</span>
          </div>
          <div className="p-2 rounded-lg border bg-card text-card-foreground space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{roomHallwayInfo.hallway_name || 'Hallway'}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDetach(roomHallwayInfo.id)}>
                <Unlink className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-[10px] text-muted-foreground">Side</Label>
                <Select value={roomHallwayInfo.side} onValueChange={(v) => handleUpdateAttachment(roomHallwayInfo.id, { side: v })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SIDES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-[10px] text-muted-foreground">Position</Label>
                <Select value={roomHallwayInfo.position} onValueChange={(v) => handleUpdateAttachment(roomHallwayInfo.id, { position: v })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-16">
                <Label className="text-[10px] text-muted-foreground">Order</Label>
                <Input
                  type="number"
                  className="h-7 text-xs"
                  value={roomHallwayInfo.sequence_order}
                  onChange={(e) => handleUpdateAttachment(roomHallwayInfo.id, { sequence_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Not attached — show attach form
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Not Attached to Hallway</span>
        </div>
        {hallways.length > 0 ? (
          <div className="space-y-2">
            <div>
              <Label className="text-xs text-muted-foreground">Hallway</Label>
              <Select value={attachForm.hallway_id} onValueChange={(v) => setAttachForm(f => ({ ...f, hallway_id: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select hallway…" /></SelectTrigger>
                <SelectContent>
                  {hallways.map(h => <SelectItem key={h.id} value={h.id} className="text-xs">{h.name || h.id.slice(0, 8)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Side</Label>
                <Select value={attachForm.side} onValueChange={(v) => setAttachForm(f => ({ ...f, side: v }))}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SIDES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Position</Label>
                <Select value={attachForm.position} onValueChange={(v) => setAttachForm(f => ({ ...f, position: v }))}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-16">
                <Label className="text-xs text-muted-foreground">Order</Label>
                <Input type="number" className="h-7 text-xs" value={attachForm.sequence_order} onChange={(e) => setAttachForm(f => ({ ...f, sequence_order: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <Button size="sm" className="w-full text-xs" onClick={handleAttachRoom}>
              <Link2 className="h-3 w-3 mr-1" /> Attach to Hallway
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No hallways found on this floor.</p>
        )}
      </div>
    );
  }

  return null;
}

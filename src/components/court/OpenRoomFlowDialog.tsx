import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export interface OpenRoomFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: {
    id: string;
    room_id: string;
    room_number: string;
  };
  hasAssignment: boolean;
  availableTargets: Array<{
    id: string; // court_rooms.id
    room_id: string;
    room_number: string;
  }>;
  onRequestShutdown: () => void;
}

export const OpenRoomFlowDialog: React.FC<OpenRoomFlowDialogProps> = ({
  open,
  onOpenChange,
  room,
  hasAssignment,
  availableTargets,
  onRequestShutdown,
}) => {
  const qc = useQueryClient();
  const [moving, setMoving] = useState(false);
  const [marking, setMarking] = useState(false);
  const [targetRoomId, setTargetRoomId] = useState<string>("");

  const canMove = hasAssignment && availableTargets.length > 0;
  const selectedTarget = useMemo(
    () => availableTargets.find(r => r.room_id === targetRoomId) || null,
    [availableTargets, targetRoomId]
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["interactive-operations"] });
    qc.invalidateQueries({ queryKey: ["court-assignments-enhanced"] });
    qc.invalidateQueries({ queryKey: ["quick-actions"] });
    qc.invalidateQueries({ queryKey: ["assignment-stats"] });
  };

  const handleMoveAssignment = async () => {
    if (!canMove || !selectedTarget) return;
    setMoving(true);
    try {
      // Find the assignment for this room
      const { data: assignment } = await supabase
        .from("court_assignments")
        .select("id")
        .eq("room_id", room.room_id)
        .limit(1)
        .maybeSingle();

      if (assignment?.id) {
        const { error } = await supabase
          .from("court_assignments")
          .update({ room_id: selectedTarget.room_id, room_number: selectedTarget.room_number })
          .eq("id", assignment.id);
        if (error) throw error;
      }

      // Cast payload to any until generated types include 'operational_status'
      await supabase.from("court_rooms").update({ operational_status: "open" } as any).eq("id", room.id);
      invalidate();
      onOpenChange(false);
    } catch (e) {
      console.error("Failed to move assignment:", e);
    } finally {
      setMoving(false);
    }
  };

  const handleMarkOpen = async () => {
    setMarking(true);
    try {
      // If there is an assignment, clear its part so it no longer counts as occupied
      if (hasAssignment) {
        const { data: assignment } = await supabase
          .from("court_assignments")
          .select("id")
          .eq("room_id", room.room_id)
          .limit(1)
          .maybeSingle();
        if (assignment?.id) {
          const { error } = await supabase
            .from("court_assignments")
            .update({ part: null })
            .eq("id", assignment.id);
          if (error) throw error;
        }
      }

      await supabase.from("court_rooms").update({ operational_status: "open" } as any).eq("id", room.id);
      invalidate();
      onOpenChange(false);
    } catch (e) {
      console.error("Failed to mark open:", e);
    } finally {
      setMarking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open Room Flow</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Choose how you want to proceed with Room {room.room_number}.
            </p>
          </div>

          <div className="space-y-2">
            <div className="p-3 border rounded-lg">
              <div className="font-medium text-sm">Move current assignment</div>
              <div className="text-xs text-muted-foreground mb-2">
                Move the assignment from this room into another available room.
              </div>
              <div className="flex gap-2 items-center">
                <select
                  className="w-full border rounded-md h-8 px-2 text-sm bg-background"
                  disabled={!canMove}
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(e.target.value)}
                >
                  <option value="">Select available room…</option>
                  {availableTargets.map((r) => (
                    <option key={r.id} value={r.room_id}>
                      Room {r.room_number}
                    </option>
                  ))}
                </select>
                <Button size="sm" disabled={!selectedTarget || moving} onClick={handleMoveAssignment}>
                  {moving ? "Moving…" : "Move"}
                </Button>
              </div>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="font-medium text-sm">Mark room open</div>
              <div className="text-xs text-muted-foreground mb-2">
                Make this room available with no assignment.
              </div>
              <Button size="sm" variant="secondary" disabled={marking} onClick={handleMarkOpen}>
                {marking ? "Saving…" : "Mark Open"}
              </Button>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="font-medium text-sm">Mark room occupied</div>
              <div className="text-xs text-muted-foreground mb-2">
                Manually flag this room as occupied without creating an assignment.
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  try {
                    await supabase.from("court_rooms").update({ operational_status: "occupied" } as any).eq("id", room.id);
                    invalidate();
                    onOpenChange(false);
                  } catch (e) {
                    console.error("Failed to mark occupied:", e);
                  }
                }}
              >
                Mark Occupied
              </Button>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="font-medium text-sm">Schedule shutdown</div>
              <div className="text-xs text-muted-foreground mb-2">
                Temporarily close this room and set a reason/timeframe.
              </div>
              <Button size="sm" variant="outline" onClick={() => { onOpenChange(false); onRequestShutdown(); }}>
                Open Shutdown Dialog
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

/**
 * QuickAvailabilityDialog allows case management coordinators to mark a courtroom as
 * unavailable or relocated due to personnel issues (e.g., judge/clerks unavailable),
 * without creating a maintenance issue. It writes to room_shutdowns so that the
 * Court Operations view picks it up immediately as a shutdown/relocation with reason.
 */

type AvailabilityKind = "unavailable" | "relocated";

type PersonnelReason =
  | "judge_unavailable"
  | "clerk_unavailable"
  | "staff_unavailable"
  | "security_issue"
  | "other";

interface QuickAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courtRoomId: string | null; // court_rooms.id (NOT the unified room_id)
  roomNumber?: string;
}

export const QuickAvailabilityDialog: React.FC<QuickAvailabilityDialogProps> = ({
  open,
  onOpenChange,
  courtRoomId,
  roomNumber,
}) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [kind, setKind] = useState<AvailabilityKind>("unavailable");
  const [reason, setReason] = useState<PersonnelReason>("judge_unavailable");
  const [details, setDetails] = useState("");
  const [tempLocation, setTempLocation] = useState("");
  const [useListLocation, setUseListLocation] = useState(true);

  const canSave = useMemo(() => !!courtRoomId && (!!reason || !!details) && (kind === "unavailable" || tempLocation.trim().length > 0), [courtRoomId, reason, details, kind, tempLocation]);

  // Load active & available rooms for relocation list
  const { data: availableRooms } = useQuery({
    queryKey: ["availability-available-rooms"],
    enabled: open && kind === "relocated",
    queryFn: async () => {
      // Get active rooms
      const { data: rooms, error: roomsError } = await supabase
        .from("court_rooms")
        .select("id, room_id, room_number, is_active")
        .eq("is_active", true)
        .order("room_number");
      if (roomsError) throw roomsError;
      // Get active/scheduled shutdowns
      const { data: shutdowns, error: shutError } = await supabase
        .from("room_shutdowns")
        .select("court_room_id, status")
        .in("status", ["in_progress", "scheduled"]);
      if (shutError) throw shutError;
      const downSet = new Set((shutdowns || []).map((s: any) => s.court_room_id));
      // Filter to available (active and not down)
      return (rooms || []).filter(r => !downSet.has(r.id));
    }
  });

  const { mutate: saveAvailability, isPending } = useMutation({
    mutationFn: async () => {
      if (!courtRoomId) throw new Error("Missing courtroom id");
      // Persist in room_shutdowns to leverage existing UI and status precedence.
      // Use status 'in_progress' to indicate it's currently down.
      const payload: any = {
        court_room_id: courtRoomId,
        status: "in_progress",
        temporary_location: kind === "relocated" ? tempLocation.trim() || null : null,
        reason: `personnel:${reason}${details ? ` - ${details.trim()}` : ''}`,
      };

      // Upsert logic: If an in_progress/scheduled shutdown already exists for this room, update it; otherwise insert.
      const { data: existing } = await supabase
        .from("room_shutdowns")
        .select("id, court_room_id, status")
        .eq("court_room_id", courtRoomId)
        .in('status', ['in_progress','scheduled'])
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("room_shutdowns")
          .update(payload)
          .eq("id", (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("room_shutdowns").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      toast({ title: "Availability updated", description: kind === 'relocated' ? `Relocated to ${tempLocation}` : "Marked unavailable" });
      qc.invalidateQueries({ queryKey: ["interactive-operations"] });
      qc.invalidateQueries({ queryKey: ["assignment-stats"] });
      qc.invalidateQueries({ queryKey: ["room-shutdowns-active"] });
      onOpenChange(false);
      setDetails("");
      setTempLocation("");
      setKind("unavailable");
      setReason("judge_unavailable");
    },
    onError: (err: any) => {
      console.error("Failed to update availability", err);
      toast({ title: "Failed to update availability", description: String(err?.message || err), variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Availability {roomNumber ? `for Room ${roomNumber}` : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <Label>Action</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as AvailabilityKind)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unavailable">Mark Unavailable</SelectItem>
                  <SelectItem value="relocated">Mark Relocated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Reason</Label>
              <Select value={reason} onValueChange={(v) => setReason(v as PersonnelReason)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="judge_unavailable">Judge unavailable</SelectItem>
                  <SelectItem value="clerk_unavailable">Clerk(s) unavailable</SelectItem>
                  <SelectItem value="staff_unavailable">Staff unavailable</SelectItem>
                  <SelectItem value="security_issue">Security issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Details (optional)</Label>
              <Input value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Add short note (e.g., Judge at arraignments, Clerk out sick)" />
            </div>

            {kind === "relocated" && (
              <div className="space-y-1">
                <Label>Temporary Location</Label>
                {useListLocation ? (
                  <Select value={tempLocation} onValueChange={setTempLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select available room" />
                    </SelectTrigger>
                    <SelectContent>
                      {(availableRooms || []).map((r: any) => (
                        <SelectItem key={r.id} value={r.room_number}>{`Room ${r.room_number}`}</SelectItem>
                      ))}
                      <SelectItem value="__custom">Custom…</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={tempLocation} onChange={(e) => setTempLocation(e.target.value)} placeholder="e.g., Room 415 or Virtual" />
                )}
                {tempLocation === "__custom" && (
                  <div className="mt-2">
                    <Input value={tempLocation === "__custom" ? "" : tempLocation} onChange={(e) => setTempLocation(e.target.value)} placeholder="Enter custom location" />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={() => saveAvailability()} disabled={!canSave || isPending}>
              {isPending ? "Saving…" : kind === "relocated" ? "Mark Relocated" : "Mark Unavailable"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

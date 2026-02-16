import { useMemo, useState, useEffect } from "react";
import { useCourtOperationsRealtime, useCourtPresence, useRoomStatus, useCourtRooms, useStaffOutToday } from "@/hooks/useCourtOperationsRealtime";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { ArrowRightLeft, AlertTriangle, CheckCircle2, XCircle, Users, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

function PresenceDot({ present }: { present: boolean }) {
  return (
    <span className={`inline-block h-2.5 w-2.5 rounded-full ${present ? 'bg-emerald-500' : 'bg-rose-500'}`} />
  );
}

export function LiveCourtGrid() {
  const { user } = useAuth();
  const actorId = user?.id || "";
  const { data: rooms, isLoading } = useCourtRooms();
  const staffOut = useStaffOutToday(); // Already returns array, not { data: ... }
  const { onMoveJudge, onMarkPresent, onMarkAbsent, onMarkClerkPresence } = useCourtOperationsRealtime();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showImpacted, setShowImpacted] = useState(false);
  const filteredRooms = useMemo(() => {
    if (!rooms || !Array.isArray(rooms)) return [];
    const term = search.trim().toLowerCase();
    return rooms.filter((r: any) => {
      const match = !term || (r.room_number?.toLowerCase().includes(term) || r.courtroom_number?.toLowerCase().includes(term));
      return match;
    });
  }, [rooms, search]);

  if (isLoading) {
    return <div>Loading live grid…</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Court Operations Live Grid</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search room…" className="pl-8 w-56" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant={showImpacted ? "default" : "outline"} onClick={() => setShowImpacted(v => !v)}>
            Recent changes
          </Button>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <Badge variant="secondary">Judges out today: {staffOut?.filter(s => s.role === 'judge').length || 0}</Badge>
            <Badge variant="secondary">Clerks out today: {staffOut?.filter(s => s.role === 'clerk').length || 0}</Badge>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Judge</TableHead>
                <TableHead>Clerks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRooms.map((room: any) => (
                <LiveRow 
                  key={room.id} 
                  room={room} 
                  actorId={actorId} 
                  onMoveJudge={onMoveJudge}
                  onMarkAbsent={onMarkAbsent}
                  onMarkPresent={onMarkPresent}
                  onMarkClerkPresence={onMarkClerkPresence}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// Record Absence Dialog Component
function RecordAbsenceDialog({ open, onOpenChange, judgeName, roomNumber, actorId }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  judgeName: string | null;
  roomNumber: string;
  actorId: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [absenceReason, setAbsenceReason] = useState("sick");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");

  const recordAbsenceMutation = useMutation({
    mutationFn: async () => {
      if (!judgeName) throw new Error("No judge name provided");

      // Find the staff member by display_name
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("id, role")
        .eq("display_name", judgeName)
        .eq("role", "judge")
        .single();

      if (staffError || !staffData) {
        throw new Error(`Judge "${judgeName}" not found in staff table`);
      }

      // Record the absence
      const { error } = await supabase.rpc("record_staff_absence", {
        p_staff_id: staffData.id,
        p_role: staffData.role,
        p_absence_reason: absenceReason,
        p_start_date: new Date(startDate).toISOString(),
        p_end_date: new Date(endDate).toISOString(),
        p_notes: notes || null,
        p_affected_room_id: null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-absences"] });
      queryClient.invalidateQueries({ queryKey: ["court", "staffOutToday"] });
      queryClient.invalidateQueries({ queryKey: ["court", "rooms"] });
      
      toast({
        title: "✅ Absence recorded",
        description: `${judgeName} marked absent (${absenceReason}) - ${startDate} to ${endDate}`,
      });
      
      onOpenChange(false);
      setNotes("");
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "Failed to record absence",
        description: (error as any).message,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Judge Absence</DialogTitle>
          <DialogDescription>
            Record absence for {judgeName || "Unknown Judge"} in {roomNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Absence Reason</Label>
            <Select value={absenceReason} onValueChange={setAbsenceReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sick">Sick Leave</SelectItem>
                <SelectItem value="vacation">Vacation</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Notes (Optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => recordAbsenceMutation.mutate()}
            disabled={!judgeName || recordAbsenceMutation.isPending}
          >
            {recordAbsenceMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Record Absence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LiveRow({ room, actorId, onMoveJudge, onMarkAbsent, onMarkPresent, onMarkClerkPresence }: {
  room: any;
  actorId: string;
  onMoveJudge: (fromRoomId: string | null, toRoomId: string, judgeName: string, actorId: string, isCovering?: boolean) => Promise<void>;
  onMarkAbsent: (roomId: string, role: "judge" | "clerk", actorId: string) => Promise<void>;
  onMarkPresent: (roomId: string, role: "judge" | "clerk", actorId: string) => Promise<void>;
  onMarkClerkPresence: (courtRoomId: string, clerkName: string, present: boolean, actorId: string) => Promise<void>;
}) {
  const { toast } = useToast();
  
  // Use data directly from room (already fetched in useCourtRooms)
  const judgePresent = room.judge_present || false;
  const clerksCount = room.clerks_present_count || 0;
  // Check maintenance status from court_rooms table
  const isMaintenance = room.maintenance_status === 'in_progress' || room.operational_status === 'maintenance';
  const statusText = isMaintenance ? 'maintenance' : (room.is_active ? 'open' : 'closed');

  const [moveOpen, setMoveOpen] = useState(false);
  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const handleMarkPresent = async () => {
    setPending(true);
    logger.debug('Marking present:', { court_room_id: room.id, room_id: room.room_id, judge: room.assigned_judge, actorId });
    try {
      await onMarkPresent(room.id, 'judge', actorId); // Use room.id (court_rooms.id) not room.room_id
      toast({
        title: "Judge marked present",
        description: `${room.assigned_judge || 'Judge'} marked present in room ${room.room_number}`,
      });
    } catch (error) {
      logger.error('Mark present error:', error);
      toast({
        title: "Failed to mark judge present",
        description: error?.message || String(error) || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  };

  const handleMarkAbsent = async () => {
    // Open dialog to record absence details instead of just marking absent
    setAbsenceDialogOpen(true);
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <div className="font-medium">{room.room_number}</div>
          {room.assigned_part && (
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400">Part {room.assigned_part}</div>
          )}
          {room.courtroom_number && (
            <div className="text-xs text-muted-foreground">Court {room.courtroom_number}</div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {room.assigned_judge && <PresenceDot present={judgePresent} />}
          <div className="flex flex-col">
            {room.assigned_judge ? (
              <>
                <span className="text-sm font-medium">{room.assigned_judge}</span>
                <span className={`text-xs ${judgePresent ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
                  {judgePresent ? '✓ Present' : 'Not marked present'}
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground italic">No judge assigned</span>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">
              {clerksCount}/{room.assigned_clerks?.length || 0} present
            </span>
          </div>
          {room.assigned_clerks && room.assigned_clerks.length > 0 ? (
            <div className="space-y-1">
              {room.assigned_clerks.map((clerk: string) => {
                const isPresent = room.clerks_present_names?.includes(clerk) || false;
                return (
                  <label key={clerk} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={isPresent}
                      onChange={async (e) => {
                        try {
                          await onMarkClerkPresence(room.id, clerk, e.target.checked, actorId);
                          toast({ 
                            title: isPresent ? "Clerk checked out" : "Clerk checked in", 
                            description: `${clerk} - Room ${room.room_number}` 
                          });
                        } catch (error) {
                          logger.error('Clerk presence error:', error);
                          toast({ title: "Error", description: error?.message || "Failed to update clerk presence", variant: "destructive" });
                        }
                      }}
                      className="h-3 w-3"
                    />
                    <span className={isPresent ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}>
                      {clerk}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">No clerks assigned</div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {statusText === 'maintenance' ? (
          <Badge variant="destructive">Maintenance</Badge>
        ) : statusText === 'closed' ? (
          <Badge variant="outline">Closed</Badge>
        ) : (
          <Badge>Open</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {judgePresent ? (
            <Button size="sm" variant="secondary" disabled={pending} onClick={handleMarkAbsent}>
              {pending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
              Mark Absent
            </Button>
          ) : (
            <Button size="sm" variant="default" disabled={pending} onClick={handleMarkPresent}>
              {pending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              Mark Present
            </Button>
          )}

          <Button size="sm" variant="outline" disabled={pending || statusText === 'maintenance'} onClick={() => setMoveOpen(true)}>
            <ArrowRightLeft className="h-4 w-4" />
          </Button>

          <MoveJudgeDialog open={moveOpen} onOpenChange={setMoveOpen} currentRoomId={room.room_id} currentJudge={room.assigned_judge} actorId={actorId} onMoveJudge={onMoveJudge} />
          <RecordAbsenceDialog 
            open={absenceDialogOpen} 
            onOpenChange={setAbsenceDialogOpen}
            judgeName={room.assigned_judge}
            roomNumber={room.room_number}
            actorId={actorId}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

function MoveJudgeDialog({ open, onOpenChange, currentRoomId, currentJudge, actorId, onMoveJudge }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentRoomId: string;
  currentJudge: string | null;
  actorId: string;
  onMoveJudge: (fromRoomId: string | null, toRoomId: string, judgeName: string, actorId: string, isCovering?: boolean) => Promise<void>;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: rooms } = useCourtRooms();
  const [judgeName, setJudgeName] = useState(currentJudge || "");
  const [toRoom, setToRoom] = useState<string>("");
  const [isCovering, setIsCovering] = useState(false);
  const [isSwap, setIsSwap] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Update judge name when dialog opens with current judge
  useEffect(() => {
    if (open && currentJudge) {
      setJudgeName(currentJudge);
    }
  }, [open, currentJudge]);

  const handleMoveJudge = async () => {
    setSaving(true);
    logger.debug('🔄 Move/Swap Judge clicked:', { 
      currentRoomId, 
      toRoom, 
      judgeName, 
      actorId,
      isSwap,
      isCovering,
      hasJudgeName: !!judgeName,
      hasToRoom: !!toRoom
    });
    
    try {
      const fromRoom = rooms?.find(r => r.room_id === currentRoomId);
      const toRoomData = rooms?.find(r => r.room_id === toRoom);
      
      if (isSwap) {
        // Use swap_courtrooms RPC function
        logger.debug('🔀 Calling swap_courtrooms with:', {
          room_a: currentRoomId,
          room_b: toRoom,
          actor: actorId
        });
        
        const { error } = await supabase.rpc('swap_courtrooms', {
          p_room_a_id: currentRoomId,
          p_room_b_id: toRoom,
          p_actor: actorId
        });
        
        if (error) throw error;
        
        // Invalidate all court-related queries
        queryClient.invalidateQueries({ queryKey: ["court", "rooms"] });
        queryClient.invalidateQueries({ queryKey: ["court-assignments-enhanced"] });
        queryClient.invalidateQueries({ queryKey: ["interactive-operations"] });
        queryClient.invalidateQueries({ queryKey: ["court", "attendance"] });
        
        toast({
          title: "✅ Courtrooms swapped successfully",
          description: `${fromRoom?.room_number} ↔ ${toRoomData?.room_number}`,
        });
      } else {
        // Use existing move_judge function
        logger.debug('➡️ Calling onMoveJudge with:', {
          from: currentRoomId,
          to: toRoom,
          judge: judgeName,
          actor: actorId,
          isCovering
        });
        
        await onMoveJudge(currentRoomId, toRoom, judgeName, actorId, isCovering);
        
        const moveType = isCovering ? 'covering' : 'moving entire part to';
        toast({
          title: "✅ Judge moved successfully",
          description: `${judgeName} ${moveType} room ${toRoomData?.room_number}`,
        });
      }
      
      logger.debug('✅ Operation successful!');
      
      onOpenChange(false);
      setJudgeName("");
      setToRoom("");
      setIsSwap(false);
    } catch (error) {
      logger.error('❌ Move/Swap error:', error);
      toast({
        title: "Failed to " + (isSwap ? "swap courtrooms" : "move judge"),
        description: error?.message || String(error) || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Move Judge</DialogTitle>
          <DialogDescription>
            Choose whether to move the entire courtroom or just have the judge cover another part.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-xs mb-1">Judge name</label>
            <Input value={judgeName} onChange={(e) => setJudgeName(e.target.value)} placeholder="e.g., Hon. Jane Doe" />
          </div>
          
          <div>
            <label className="block text-xs mb-1">Destination room</label>
            <Select value={toRoom} onValueChange={setToRoom}>
              <SelectTrigger>
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                {(rooms || [])
                  .filter((r: Record<string, unknown>) => {
                    if (r.room_id === currentRoomId) return false; // Exclude current room
                    if (!r.is_active) return false; // Only active rooms
                    
                    if (isSwap) {
                      // Swap mode: Show ALL active rooms (empty or occupied)
                      return true;
                    } else {
                      // Move mode: Only show EMPTY rooms
                      if (r.assigned_judge && (r.assigned_judge as string).trim()) return false;
                      return true;
                    }
                  })
                  .map((r: any) => {
                    const hasJudge = r.assigned_judge && r.assigned_judge.trim();
                    const label = hasJudge 
                      ? `${r.room_number} · ${r.assigned_judge} (Part ${r.assigned_part || '?'})`
                      : `${r.room_number}${r.courtroom_number ? ` · Court ${r.courtroom_number}` : ''} (Available)`;
                    
                    return (
                      <SelectItem key={r.room_id} value={r.room_id}>
                        {label}
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
            {isSwap && (
              <p className="text-xs text-muted-foreground mt-1">
                💡 Swap mode: Both occupied and empty rooms are shown
              </p>
            )}
          </div>
          
          <div className="space-y-2 p-3 bg-muted/50 rounded-md">
            <label className="block text-sm font-medium">Operation Type</label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="radio" 
                  checked={!isSwap && !isCovering} 
                  onChange={() => { setIsSwap(false); setIsCovering(false); }}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-sm">➡️ Move Entire Part</div>
                  <div className="text-xs text-muted-foreground">
                    Moves judge, clerks, part number, and all courtroom details to an empty room
                  </div>
                </div>
              </label>
              
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="radio" 
                  checked={!isSwap && isCovering} 
                  onChange={() => { setIsSwap(false); setIsCovering(true); }}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-sm">🔄 Covering Another Part</div>
                  <div className="text-xs text-muted-foreground">
                    Judge temporarily covers destination room, keeps their original part number
                  </div>
                </div>
              </label>
              
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="radio" 
                  checked={isSwap} 
                  onChange={() => { setIsSwap(true); setIsCovering(false); }}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-sm">🔀 Swap Courtrooms</div>
                  <div className="text-xs text-muted-foreground">
                    Completely exchanges all assignments between two courtrooms (judges, clerks, parts, etc.)
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" disabled={!toRoom || (!isSwap && !judgeName) || saving} onClick={handleMoveJudge}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {isSwap ? '🔀 Confirm Swap' : '➡️ Confirm Move'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LiveCourtGrid;

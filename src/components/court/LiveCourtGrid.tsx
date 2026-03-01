import { useMemo, useState, useEffect } from "react";
import { useCourtOperationsRealtime, useCourtRooms, useStaffOutToday } from "@/hooks/useCourtOperationsRealtime";
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
import { ArrowRightLeft, AlertTriangle, CheckCircle2, XCircle, Users, Search, Loader2, UserPlus, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

function PresenceDot({ present }: { present: boolean }) {
  return (
    <span className={`inline-block h-2.5 w-2.5 rounded-full ${present ? 'bg-emerald-500' : 'bg-rose-500'}`} />
  );
}

// ─── Batch Change Types ───
interface BatchChange {
  id: string;
  type: 'swap' | 'move' | 'assign' | 'reassign';
  description: string;
  fromRoomId?: string;
  toRoomId?: string;
  judgeName?: string;
  part?: string;
  isCovering?: boolean;
}

export function LiveCourtGrid() {
  const { user } = useAuth();
  const actorId = user?.id || "";
  const { data: rooms, isLoading } = useCourtRooms();
  const staffOut = useStaffOutToday();
  const { onMoveJudge, onMarkPresent, onMarkAbsent, onMarkClerkPresence } = useCourtOperationsRealtime();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [buildingFilter, setBuildingFilter] = useState<string>("all");
  const [showImpacted, setShowImpacted] = useState(false);

  // Batch mode state
  const [batchMode, setBatchMode] = useState(false);
  const [batchChanges, setBatchChanges] = useState<BatchChange[]>([]);
  const [executingBatch, setExecutingBatch] = useState(false);

  // Get unique buildings for filter
  const buildings = useMemo(() => {
    if (!rooms || !Array.isArray(rooms)) return [];
    const names = [...new Set(rooms.map((r: any) => r.building_name).filter(Boolean))] as string[];
    return names.sort();
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    if (!rooms || !Array.isArray(rooms)) return [];
    const term = search.trim().toLowerCase();
    return rooms.filter((r: any) => {
      const matchSearch = !term || (
        r.room_number?.toLowerCase().includes(term) ||
        r.courtroom_number?.toLowerCase().includes(term) ||
        r.assigned_judge?.toLowerCase().includes(term) ||
        r.assigned_part?.toLowerCase().includes(term)
      );
      const matchBuilding = buildingFilter === "all" || r.building_name === buildingFilter;
      return matchSearch && matchBuilding;
    });
  }, [rooms, search, buildingFilter]);

  const addBatchChange = (change: BatchChange) => {
    setBatchChanges(prev => [...prev, change]);
  };

  const removeBatchChange = (id: string) => {
    setBatchChanges(prev => prev.filter(c => c.id !== id));
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const executeBatch = async () => {
    setExecutingBatch(true);
    let successCount = 0;
    let failCount = 0;

    for (const change of batchChanges) {
      try {
        if (change.type === 'swap' && change.fromRoomId && change.toRoomId) {
          const { error } = await supabase.rpc('swap_courtrooms', {
            p_room_a_id: change.fromRoomId,
            p_room_b_id: change.toRoomId,
            p_actor: actorId
          });
          if (error) throw error;
        } else if (change.type === 'move' && change.toRoomId && change.judgeName) {
          await onMoveJudge(change.fromRoomId || null, change.toRoomId, change.judgeName, actorId, change.isCovering);
        } else if (change.type === 'reassign' && change.toRoomId && change.judgeName) {
          // Reassign: put judge in destination, clear from source
          const { error: destErr } = await supabase
            .from("court_assignments")
            .update({ justice: change.judgeName })
            .eq("room_id", change.toRoomId);
          if (destErr) throw destErr;
          if (change.fromRoomId) {
            const { error: srcErr } = await supabase
              .from("court_assignments")
              .update({ justice: null })
              .eq("room_id", change.fromRoomId);
            if (srcErr) throw srcErr;
          }
        } else if (change.type === 'assign' && change.toRoomId) {
          const targetRoom = rooms?.find((r: any) => r.room_id === change.toRoomId);
          if (!targetRoom) throw new Error("Room not found");
          const { error } = await supabase.from("court_assignments").upsert({
            room_id: change.toRoomId,
            room_number: (targetRoom as any).room_number,
            justice: change.judgeName || null,
            part: change.part || null,
          });
          if (error) throw error;
        }
        successCount++;
      } catch (e) {
        logger.error('Batch change failed:', { change, error: e });
        failCount++;
      }
    }

    // Invalidate all queries
    queryClient.invalidateQueries({ queryKey: ["court"] });
    queryClient.invalidateQueries({ queryKey: ["court-assignments-enhanced"] });
    queryClient.invalidateQueries({ queryKey: ["interactive-operations"] });

    toast({
      title: `Batch complete: ${successCount} succeeded${failCount ? `, ${failCount} failed` : ''}`,
    });

    setBatchChanges([]);
    setBatchMode(false);
    setExecutingBatch(false);
  };

  if (isLoading) {
    return <div>Loading live grid…</div>;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">Live Court Status</CardTitle>
        <div className="flex gap-2 mt-2">
          <div className="flex items-center gap-1.5 text-sm px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="font-semibold">{staffOut?.filter(s => s.role === 'judge').length || 0}</span>
            <span className="text-xs">judges out</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="font-semibold">{staffOut?.filter(s => s.role === 'clerk').length || 0}</span>
            <span className="text-xs">clerks out</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="relative flex-1 min-w-[150px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search room, judge, part…" className="pl-8" />
          </div>
          {buildings.length > 1 && (
            <Select value={buildingFilter} onValueChange={setBuildingFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Building" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Buildings</SelectItem>
                {buildings.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant={batchMode ? "default" : "outline"}
            size="sm"
            onClick={() => { setBatchMode(v => !v); if (batchMode) setBatchChanges([]); }}
          >
            <Layers className="h-4 w-4 mr-1" />
            {batchMode ? `Batch (${batchChanges.length})` : 'Batch Mode'}
          </Button>
        </div>

        {/* Batch preview bar */}
        {batchMode && batchChanges.length > 0 && (
          <div className="mb-3 p-3 border rounded-md bg-amber-500/5 border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {batchChanges.length} pending change{batchChanges.length > 1 ? 's' : ''}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setBatchChanges([])}>Clear All</Button>
                <Button size="sm" onClick={executeBatch} disabled={executingBatch}>
                  {executingBatch ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                  Apply All Changes
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              {batchChanges.map(c => (
                <div key={c.id} className="flex items-center justify-between text-xs py-1 px-2 bg-background rounded">
                  <span>{c.description}</span>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => removeBatchChange(c.id)}>✕</Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                {buildings.length > 1 && <TableHead>Building</TableHead>}
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
                  showBuilding={buildings.length > 1}
                  batchMode={batchMode}
                  onAddBatchChange={addBatchChange}
                  allRooms={rooms || []}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Record Absence Dialog ───
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
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("id, role")
        .eq("display_name", judgeName)
        .eq("role", "judge")
        .single();
      if (staffError || !staffData) throw new Error(`Judge "${judgeName}" not found in staff table`);
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
      toast({ title: "✅ Absence recorded", description: `${judgeName} marked absent (${absenceReason})` });
      onOpenChange(false);
      setNotes("");
    },
    onError: (error: unknown) => {
      toast({ variant: "destructive", title: "Failed to record absence", description: (error as any).message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Judge Absence</DialogTitle>
          <DialogDescription>Record absence for {judgeName || "Unknown Judge"} in {roomNumber}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Absence Reason</Label>
            <Select value={absenceReason} onValueChange={setAbsenceReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
            <div><Label>Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><Label>End Date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          </div>
          <div><Label>Notes (Optional)</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional details..." /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => recordAbsenceMutation.mutate()} disabled={!judgeName || recordAbsenceMutation.isPending}>
            {recordAbsenceMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Record Absence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assign Judge Dialog (for vacant rooms) ───
function AssignJudgeDialog({ open, onOpenChange, room, actorId }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  room: any;
  actorId: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [judgeName, setJudgeName] = useState("");
  const [partName, setPartName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAssign = async () => {
    if (!judgeName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("court_assignments").upsert({
        room_id: room.room_id,
        room_number: room.room_number,
        justice: judgeName.trim(),
        part: partName.trim() || null,
      });
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["court"] });
      queryClient.invalidateQueries({ queryKey: ["court-assignments-enhanced"] });
      toast({ title: "✅ Judge assigned", description: `${judgeName} → Room ${room.room_number}` });
      onOpenChange(false);
      setJudgeName("");
      setPartName("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to assign judge", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Judge to Room {room.room_number}</DialogTitle>
          <DialogDescription>
            {room.building_name && <span className="font-medium">{room.building_name}</span>}
            {' — '}This room currently has no judge assigned.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Judge Name</Label>
            <Input value={judgeName} onChange={e => setJudgeName(e.target.value)} placeholder="e.g., Hon. Jane Doe" />
          </div>
          <div>
            <Label>Part (optional)</Label>
            <Input value={partName} onChange={e => setPartName(e.target.value)} placeholder="e.g., Part 32" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!judgeName.trim() || saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Assign Judge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Live Row ───
function LiveRow({ room, actorId, onMoveJudge, onMarkAbsent, onMarkPresent, onMarkClerkPresence, showBuilding, batchMode, onAddBatchChange, allRooms }: {
  room: any;
  actorId: string;
  onMoveJudge: (fromRoomId: string | null, toRoomId: string, judgeName: string, actorId: string, isCovering?: boolean) => Promise<void>;
  onMarkAbsent: (roomId: string, role: "judge" | "clerk", actorId: string) => Promise<void>;
  onMarkPresent: (roomId: string, role: "judge" | "clerk", actorId: string) => Promise<void>;
  onMarkClerkPresence: (courtRoomId: string, clerkName: string, present: boolean, actorId: string) => Promise<void>;
  showBuilding: boolean;
  batchMode: boolean;
  onAddBatchChange: (change: BatchChange) => void;
  allRooms: any[];
}) {
  const { toast } = useToast();
  const judgePresent = room.judge_present || false;
  const clerksCount = room.clerks_present_count || 0;
  const isMaintenance = room.maintenance_status === 'in_progress' || room.operational_status === 'maintenance';
  const statusText = isMaintenance ? 'maintenance' : (room.is_active ? 'open' : 'closed');
  const hasJudge = room.assigned_judge && room.assigned_judge.trim();

  const [moveOpen, setMoveOpen] = useState(false);
  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const handleMarkPresent = async () => {
    setPending(true);
    try {
      await onMarkPresent(room.id, 'judge', actorId);
      toast({ title: "Judge marked present", description: `${room.assigned_judge || 'Judge'} in room ${room.room_number}` });
    } catch (error: any) {
      toast({ title: "Failed to mark judge present", description: error?.message || String(error), variant: "destructive" });
    } finally {
      setPending(false);
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <div className="font-medium">{room.room_number}</div>
          {room.assigned_part && (
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400">{room.assigned_part}</div>
          )}
          {room.courtroom_number && (
            <div className="text-xs text-muted-foreground">Court {room.courtroom_number}</div>
          )}
        </div>
      </TableCell>
      {showBuilding && (
        <TableCell>
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {room.building_name || '—'}
          </Badge>
        </TableCell>
      )}
      <TableCell>
        <div className="flex items-center gap-2">
          {hasJudge && <PresenceDot present={judgePresent} />}
          <div className="flex flex-col">
            {hasJudge ? (
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
                          toast({ title: isPresent ? "Clerk checked out" : "Clerk checked in", description: `${clerk} - Room ${room.room_number}` });
                        } catch (error: any) {
                          toast({ title: "Error", description: error?.message || "Failed to update", variant: "destructive" });
                        }
                      }}
                      className="h-3 w-3"
                    />
                    <span className={isPresent ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}>{clerk}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">No clerks assigned</div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {hasJudge ? (
            <>
              {judgePresent ? (
                <Button size="sm" variant="secondary" disabled={pending} onClick={() => setAbsenceDialogOpen(true)}>
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
            </>
          ) : (
            <Button size="sm" variant="default" onClick={() => setAssignOpen(true)}>
              <UserPlus className="h-4 w-4 mr-1" />
              Assign Judge
            </Button>
          )}
        </div>

        <MoveJudgeDialog
          open={moveOpen}
          onOpenChange={setMoveOpen}
          currentRoomId={room.room_id}
          currentJudge={room.assigned_judge}
          actorId={actorId}
          onMoveJudge={onMoveJudge}
          batchMode={batchMode}
          onAddBatchChange={onAddBatchChange}
          currentRoomNumber={room.room_number}
        />
        <RecordAbsenceDialog
          open={absenceDialogOpen}
          onOpenChange={setAbsenceDialogOpen}
          judgeName={room.assigned_judge}
          roomNumber={room.room_number}
          actorId={actorId}
        />
        <AssignJudgeDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          room={room}
          actorId={actorId}
        />
      </TableCell>
    </TableRow>
  );
}

// ─── Move / Swap Dialog ───
function MoveJudgeDialog({ open, onOpenChange, currentRoomId, currentJudge, actorId, onMoveJudge, batchMode, onAddBatchChange, currentRoomNumber }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentRoomId: string;
  currentJudge: string | null;
  actorId: string;
  onMoveJudge: (fromRoomId: string | null, toRoomId: string, judgeName: string, actorId: string, isCovering?: boolean) => Promise<void>;
  batchMode: boolean;
  onAddBatchChange: (change: BatchChange) => void;
  currentRoomNumber: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: rooms } = useCourtRooms();
  const [judgeName, setJudgeName] = useState(currentJudge || "");
  const [toRoom, setToRoom] = useState<string>("");
  const [isCovering, setIsCovering] = useState(false);
  const [isSwap, setIsSwap] = useState(false);
  const [isReassign, setIsReassign] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && currentJudge) setJudgeName(currentJudge);
  }, [open, currentJudge]);

  // Group rooms by building for the picker
  const groupedRooms = useMemo(() => {
    if (!rooms) return {};
    const filtered = rooms.filter((r: any) => {
      if (r.room_id === currentRoomId) return false;
      if (!r.is_active) return false;
      // Show all rooms for swap and reassign; only empty rooms for move
      if (!isSwap && !isReassign && r.assigned_judge?.trim()) return false;
      return true;
    });
    const groups: Record<string, any[]> = {};
    for (const r of filtered as any[]) {
      const bldg = r.building_name || 'Other';
      if (!groups[bldg]) groups[bldg] = [];
      groups[bldg].push(r);
    }
    return groups;
  }, [rooms, currentRoomId, isSwap, isReassign]);

  // Check if selected destination has a judge (for displacement warning)
  const destinationRoom = useMemo(() => {
    if (!toRoom || !rooms) return null;
    return rooms.find((r: any) => r.room_id === toRoom) as any;
  }, [toRoom, rooms]);
  const willDisplace = isReassign && destinationRoom?.assigned_judge?.trim();

  const handleMoveJudge = async () => {
    if (batchMode) {
      const toRoomData = rooms?.find((r: any) => r.room_id === toRoom) as any;
      const opType = isSwap ? 'swap' : isReassign ? 'reassign' : 'move';
      const desc = isSwap
        ? `Swap ${currentRoomNumber} ↔ ${toRoomData?.room_number}`
        : isReassign
          ? `Reassign ${judgeName} → ${toRoomData?.room_number}${willDisplace ? ` (displaces ${toRoomData.assigned_judge})` : ''}`
          : `Move ${judgeName} → ${toRoomData?.room_number}`;
      onAddBatchChange({
        id: crypto.randomUUID(),
        type: opType,
        description: desc,
        fromRoomId: currentRoomId,
        toRoomId: toRoom,
        judgeName,
        isCovering,
      });
      toast({ title: "Added to batch", description: `Queued ${opType} for ${currentRoomNumber}` });
      onOpenChange(false);
      return;
    }

    setSaving(true);
    try {
      const toRoomData = rooms?.find((r: any) => r.room_id === toRoom) as any;

      if (isReassign) {
        // Reassign: place judge in destination, clear from source
        // 1. Update destination assignment
        const { error: destErr } = await supabase
          .from("court_assignments")
          .update({ justice: judgeName })
          .eq("room_id", toRoom);
        if (destErr) throw destErr;

        // 2. Clear source assignment
        const { error: srcErr } = await supabase
          .from("court_assignments")
          .update({ justice: null })
          .eq("room_id", currentRoomId);
        if (srcErr) throw srcErr;

        queryClient.invalidateQueries({ queryKey: ["court"] });
        queryClient.invalidateQueries({ queryKey: ["court-assignments-enhanced"] });
        const msg = willDisplace
          ? `${judgeName} → ${toRoomData?.room_number} (displaced ${toRoomData.assigned_judge})`
          : `${judgeName} → ${toRoomData?.room_number}`;
        toast({ title: "✅ Judge reassigned", description: msg });
      } else if (isSwap) {
        const { error } = await supabase.rpc('swap_courtrooms', {
          p_room_a_id: currentRoomId,
          p_room_b_id: toRoom,
          p_actor: actorId
        });
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["court"] });
        queryClient.invalidateQueries({ queryKey: ["court-assignments-enhanced"] });
        toast({ title: "✅ Courtrooms swapped", description: `${currentRoomNumber} ↔ ${toRoomData?.room_number}` });
      } else {
        await onMoveJudge(currentRoomId, toRoom, judgeName, actorId, isCovering);
        toast({ title: "✅ Judge moved", description: `${judgeName} → room ${toRoomData?.room_number}` });
      }

      onOpenChange(false);
      setJudgeName("");
      setToRoom("");
      setIsSwap(false);
      setIsReassign(false);
    } catch (error: any) {
      toast({ title: "Failed", description: error?.message || String(error), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{batchMode ? '🗂️ Queue Change' : 'Move Judge'}</DialogTitle>
          <DialogDescription>
            {batchMode
              ? 'This change will be queued and applied with other batch changes.'
              : 'Choose whether to move the entire courtroom or just have the judge cover another part.'}
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
                {Object.entries(groupedRooms).map(([building, bldgRooms]) => (
                  <div key={building}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                      {building}
                    </div>
                    {bldgRooms.map((r: any) => {
                      const hasJudge = r.assigned_judge?.trim();
                      const label = hasJudge
                        ? `${r.room_number} · ${r.assigned_judge} (${r.assigned_part || '?'})`
                        : `${r.room_number} (Available)`;
                      return (
                        <SelectItem key={r.room_id} value={r.room_id}>{label}</SelectItem>
                      );
                    })}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 p-3 bg-muted/50 rounded-md">
            <label className="block text-sm font-medium">Operation Type</label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" checked={!isSwap && !isCovering && !isReassign} onChange={() => { setIsSwap(false); setIsCovering(false); setIsReassign(false); }} className="mt-1" />
                <div>
                  <div className="font-medium text-sm">➡️ Move Entire Part</div>
                  <div className="text-xs text-muted-foreground">Moves judge, clerks, part to an empty room</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" checked={isReassign} onChange={() => { setIsReassign(true); setIsSwap(false); setIsCovering(false); }} className="mt-1" />
                <div>
                  <div className="font-medium text-sm">📌 Reassign to Room</div>
                  <div className="text-xs text-muted-foreground">Place judge into any room — occupied or empty. Displaces current occupant if any.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" checked={!isSwap && isCovering && !isReassign} onChange={() => { setIsSwap(false); setIsCovering(true); setIsReassign(false); }} className="mt-1" />
                <div>
                  <div className="font-medium text-sm">🔄 Covering Another Part</div>
                  <div className="text-xs text-muted-foreground">Judge temporarily covers destination room</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" checked={isSwap} onChange={() => { setIsSwap(true); setIsCovering(false); setIsReassign(false); }} className="mt-1" />
                <div>
                  <div className="font-medium text-sm">🔀 Swap Courtrooms</div>
                  <div className="text-xs text-muted-foreground">Exchanges all assignments between two courtrooms</div>
                </div>
              </label>
            </div>
          </div>

          {/* Displacement warning */}
          {willDisplace && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold">This will displace {destinationRoom.assigned_judge}</span> from Room {destinationRoom.room_number}. They will become unassigned.
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="button" disabled={!toRoom || (!isSwap && !judgeName) || saving} onClick={handleMoveJudge}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {batchMode ? '📋 Add to Batch' : isReassign ? '📌 Confirm Reassign' : isSwap ? '🔀 Confirm Swap' : '➡️ Confirm Move'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LiveCourtGrid;

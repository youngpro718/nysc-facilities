import { useMemo, useState, useEffect, useCallback } from "react";
import { useCourtOperationsRealtime, useCourtRooms, useStaffOutToday } from "@features/court/hooks/useCourtOperationsRealtime";
import { useCourtPersonnel } from "@features/court/hooks/useCourtPersonnel";
import { useAuth } from "@features/auth/hooks/useAuth";
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
import { ArrowRightLeft, AlertTriangle, CheckCircle2, XCircle, Users, Search, Loader2, UserPlus, MousePointerClick, Undo2, X } from "lucide-react";
import { useToast } from "@shared/hooks/use-toast";
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

interface QuickReassignSource {
  roomId: string;
  roomNumber: string;
  judgeName: string;
  part: string | null;
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

  const [executingBatch, setExecutingBatch] = useState(false);

  // Quick Reassign mode state
  const [quickReassignMode, setQuickReassignMode] = useState(false);
  const [quickReassignSource, setQuickReassignSource] = useState<QuickReassignSource | null>(null);
  const [quickReassignQueue, setQuickReassignQueue] = useState<BatchChange[]>([]);

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

  // ─── Quick Reassign click handler ───
  const handleQuickReassignClick = useCallback((room: any) => {
    if (!quickReassignMode) return;

    const hasJudge = room.assigned_judge?.trim();

    if (!quickReassignSource) {
      // First click: select source
      if (!hasJudge) return; // Can't select a room with no judge as source
      setQuickReassignSource({
        roomId: room.room_id,
        roomNumber: room.room_number,
        judgeName: room.assigned_judge,
        part: room.assigned_part || null,
      });
    } else {
      // Second click: queue the reassignment
      if (room.room_id === quickReassignSource.roomId) {
        // Clicked same room — deselect
        setQuickReassignSource(null);
        return;
      }

      const destJudge = hasJudge ? room.assigned_judge : null;
      const destPart = room.assigned_part || null;

      const change: BatchChange = {
        id: crypto.randomUUID(),
        type: 'reassign',
        description: `${quickReassignSource.judgeName} → Room ${room.room_number}${destJudge ? ` (displaces ${destJudge})` : ''}`,
        fromRoomId: quickReassignSource.roomId,
        toRoomId: room.room_id,
        judgeName: quickReassignSource.judgeName,
      };

      setQuickReassignQueue(prev => [...prev, change]);

      // Auto-chain: if destination had a judge, auto-select them as next source
      if (destJudge) {
        setQuickReassignSource({
          roomId: room.room_id,
          roomNumber: room.room_number,
          judgeName: destJudge,
          part: destPart,
        });
      } else {
        setQuickReassignSource(null);
      }
    }
  }, [quickReassignMode, quickReassignSource]);

  const undoLastQuickReassign = () => {
    setQuickReassignQueue(prev => prev.slice(0, -1));
    setQuickReassignSource(null);
  };

  const cancelQuickReassign = () => {
    setQuickReassignMode(false);
    setQuickReassignSource(null);
    setQuickReassignQueue([]);
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const executeChanges = async (changes: BatchChange[]) => {
    setExecutingBatch(true);
    let successCount = 0;
    let failCount = 0;

    for (const change of changes) {
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
      } catch (error) {
        logger.error('Batch change failed:', { change, error });
        failCount++;
      }
    }

    queryClient.invalidateQueries({ queryKey: ["court"] });
    queryClient.invalidateQueries({ queryKey: ["court-assignments-enhanced"] });
    queryClient.invalidateQueries({ queryKey: ["interactive-operations"] });

    toast({
      title: `Batch complete: ${successCount} succeeded${failCount ? `, ${failCount} failed` : ''}`,
    });

    setExecutingBatch(false);
  };

  const executeQuickReassign = async () => {
    await executeChanges(quickReassignQueue);
    setQuickReassignQueue([]);
    setQuickReassignSource(null);
    setQuickReassignMode(false);
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
            variant={quickReassignMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (quickReassignMode) {
                cancelQuickReassign();
              } else {
                setQuickReassignMode(true);
              }
            }}
            className={quickReassignMode ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
          >
            <MousePointerClick className="h-4 w-4 mr-1" />
            {quickReassignMode ? 'Exit Quick Reassign' : 'Quick Reassign'}
          </Button>
        </div>

        {/* Quick Reassign source indicator */}
        {quickReassignMode && (
          <div className="mb-3 p-3 border rounded-md bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300">
            {quickReassignSource ? (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Selected: Room {quickReassignSource.roomNumber} · {quickReassignSource.judgeName}
                  {quickReassignSource.part && ` (${quickReassignSource.part})`}
                  <span className="ml-2 text-xs font-normal opacity-75">— now click a destination room</span>
                </span>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-600" onClick={() => setQuickReassignSource(null)}>
                  <X className="h-3 w-3 mr-1" /> Deselect
                </Button>
              </div>
            ) : (
              <span className="text-sm">Click a room with a judge to select it as the source.</span>
            )}
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden md:block rounded-md border overflow-x-auto">
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
                  allRooms={rooms || []}
                  quickReassignMode={quickReassignMode}
                  quickReassignSourceId={quickReassignSource?.roomId || null}
                  onQuickReassignClick={handleQuickReassignClick}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card list */}
        <div className="block md:hidden space-y-2">
          {filteredRooms.map((room: any) => (
            <LiveMobileCard
              key={room.id}
              room={room}
              actorId={actorId}
              onMoveJudge={onMoveJudge}
              onMarkAbsent={onMarkAbsent}
              onMarkPresent={onMarkPresent}
              onMarkClerkPresence={onMarkClerkPresence}
              showBuilding={buildings.length > 1}
              allRooms={rooms || []}
              quickReassignMode={quickReassignMode}
              quickReassignSourceId={quickReassignSource?.roomId || null}
              onQuickReassignClick={handleQuickReassignClick}
            />
          ))}
        </div>

        {/* Quick Reassign floating bar */}
        {quickReassignMode && quickReassignQueue.length > 0 && (
          <div className="sticky bottom-0 mt-3 p-4 border rounded-lg bg-background shadow-lg border-blue-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                {quickReassignQueue.length} reassignment{quickReassignQueue.length > 1 ? 's' : ''} queued
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={undoLastQuickReassign}>
                  <Undo2 className="h-4 w-4 mr-1" /> Undo Last
                </Button>
                <Button size="sm" variant="outline" onClick={cancelQuickReassign}>Cancel</Button>
                <Button size="sm" onClick={executeQuickReassign} disabled={executingBatch} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {executingBatch ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                  Apply All
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              {quickReassignQueue.map((c, i) => (
                <div key={c.id} className="flex items-center gap-2 text-xs py-1.5 px-2 bg-muted/50 rounded">
                  <span className="font-medium text-muted-foreground">{i + 1}.</span>
                  <span>{c.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
  const { personnel } = useCourtPersonnel();
  const { onMoveJudge } = useCourtOperationsRealtime();
  
  const [judgeName, setJudgeName] = useState("");
  const [partName, setPartName] = useState("");
  const [opType, setOpType] = useState<'assign' | 'cover' | 'reassign'>('assign');
  const [saving, setSaving] = useState(false);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setJudgeName("");
      setPartName("");
      setOpType('assign');
    }
  }, [open]);

  // Derive active judges list
  const activeJudges = useMemo(() => {
    if (!personnel || !personnel.judges) return [];
    return [...personnel.judges]
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [personnel]);

  const handleAssign = async () => {
    const trimmedName = judgeName.trim();
    if (!trimmedName) return;
    setSaving(true);
    try {
      if (opType === 'assign') {
        // Option 1: Set judge permanently in the new room
        const { error } = await supabase.from("court_assignments").upsert({
          room_id: room.room_id,
          room_number: room.room_number,
          justice: trimmedName,
          part: partName.trim() || null,
        });
        if (error) throw error;
        toast({ title: "✅ Judge assigned", description: `${trimmedName} → Room ${room.room_number}` });

      } else if (opType === 'reassign' || opType === 'cover') {
        // Both reassign and cover need the judge's current room(s)
        const { data: currentAssignments } = await supabase
          .from("court_assignments")
          .select("room_id")
          .ilike("justice", `%${trimmedName}%`);

        if (opType === 'reassign') {
          // Option 2: Nullify all current assignments, then upsert here
          if (currentAssignments && currentAssignments.length > 0) {
            const roomIds = currentAssignments.map(a => a.room_id);
            await supabase.from("court_assignments").update({ justice: null }).in("room_id", roomIds);
          }
          const { error } = await supabase.from("court_assignments").upsert({
            room_id: room.room_id,
            room_number: room.room_number,
            justice: trimmedName,
            part: partName.trim() || null,
          });
          if (error) throw error;
          toast({ title: "✅ Judge reassigned", description: `${trimmedName} moved to Room ${room.room_number}` });

        } else {
          // Option 3: Covering — temporary assignment using move logic
          const fromRoomId = currentAssignments && currentAssignments.length > 0 ? currentAssignments[0].room_id : null;
          await onMoveJudge(fromRoomId, room.room_id, trimmedName, actorId, true);
          toast({ title: "✅ Covering assignment", description: `${trimmedName} covering Room ${room.room_number}` });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["court"] });
      queryClient.invalidateQueries({ queryKey: ["court-assignments-enhanced"] });
      onOpenChange(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to assign judge", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Judge to Room {room.room_number}</DialogTitle>
          <DialogDescription>
            {room.building_name && <span className="font-medium">{room.building_name}</span>}
            {' — '}This room currently has no judge assigned.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Select Judge</Label>
            <Select value={judgeName} onValueChange={setJudgeName}>
              <SelectTrigger>
                <SelectValue placeholder="Select a judge..." />
              </SelectTrigger>
              <SelectContent>
                {activeJudges.map(j => (
                  <SelectItem key={j.id} value={j.name}>{j.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {(opType === 'assign' || opType === 'reassign') && (
            <div>
              <Label className="mb-2 block">Part (optional)</Label>
              <Input value={partName} onChange={e => setPartName(e.target.value)} placeholder="e.g., Part 32" />
            </div>
          )}

          <div className="space-y-2 p-3 bg-muted/50 rounded-md">
            <Label className="block text-sm font-medium mb-2">Assignment Type</Label>
            <div className="space-y-3 mt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" checked={opType === 'assign'} onChange={() => setOpType('assign')} className="mt-1" />
                <div>
                  <div className="font-medium text-sm">👤 Assign Permanently</div>
                  <div className="text-xs text-muted-foreground">Sets judge as primary occupant for this room. If they have another room, they'll now be in both.</div>
                </div>
              </label>
              
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" checked={opType === 'reassign'} onChange={() => setOpType('reassign')} className="mt-1" />
                <div>
                  <div className="font-medium text-sm">📌 Reassign to Room</div>
                  <div className="text-xs text-muted-foreground">Removes judge from their current room(s) and assigns them here permanently.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" checked={opType === 'cover'} onChange={() => setOpType('cover')} className="mt-1" />
                <div>
                  <div className="font-medium text-sm">🔄 Covering Another Part</div>
                  <div className="text-xs text-muted-foreground">Temporary assignment for today. Does not clear their primary courtroom.</div>
                </div>
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!judgeName.trim() || saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Confirm Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Live Mobile Card ───
function LiveMobileCard({ room, actorId, onMoveJudge, onMarkAbsent, onMarkPresent, onMarkClerkPresence, showBuilding, allRooms, quickReassignMode, quickReassignSourceId, onQuickReassignClick }: {
  room: any;
  actorId: string;
  onMoveJudge: (fromRoomId: string | null, toRoomId: string, judgeName: string, actorId: string, isCovering?: boolean) => Promise<void>;
  onMarkAbsent: (roomId: string, role: "judge" | "clerk", actorId: string) => Promise<void>;
  onMarkPresent: (roomId: string, role: "judge" | "clerk", actorId: string) => Promise<void>;
  onMarkClerkPresence: (courtRoomId: string, clerkName: string, present: boolean, actorId: string) => Promise<void>;
  showBuilding: boolean;
  allRooms: any[];
  quickReassignMode: boolean;
  quickReassignSourceId: string | null;
  onQuickReassignClick: (room: any) => void;
}) {
  const { toast } = useToast();
  const judgePresent = room.judge_present || false;
  const clerksCount = room.clerks_present_count || 0;
  const totalClerks = room.assigned_clerks?.length || 0;
  const hasJudge = room.assigned_judge && room.assigned_judge.trim();
  const isSelectedSource = quickReassignSourceId === room.room_id;
  const [pending, setPending] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

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
    <div
      onClick={quickReassignMode ? () => onQuickReassignClick(room) : undefined}
      className={[
        "rounded-lg border p-3 space-y-2 bg-card",
        quickReassignMode ? "cursor-pointer hover:bg-blue-500/10 active:bg-blue-500/20 transition-colors" : "",
        isSelectedSource ? "bg-blue-500/15 ring-2 ring-blue-500/40" : "",
      ].filter(Boolean).join(" ")}
    >
      {/* Room header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="font-semibold text-sm">{room.room_number}</span>
          {room.assigned_part && (
            <span className="ml-2 text-xs font-medium text-blue-600 dark:text-blue-400">{room.assigned_part}</span>
          )}
        </div>
        {showBuilding && room.building_name && (
          <Badge variant="outline" className="text-xs">{room.building_name}</Badge>
        )}
      </div>

      {/* Judge */}
      <div className="flex items-center gap-2">
        <PresenceDot present={judgePresent} />
        <span className="text-sm flex-1">
          {hasJudge ? room.assigned_judge : <span className="text-muted-foreground italic">No judge assigned</span>}
        </span>
        {hasJudge && (
          <span className={`text-xs ${judgePresent ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"}`}>
            {judgePresent ? "✓ Present" : "Absent"}
          </span>
        )}
      </div>

      {/* Clerks */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5 shrink-0" />
        <span>{clerksCount}/{totalClerks} clerks present</span>
      </div>

      {/* Actions */}
      {!quickReassignMode && (
        <div className="flex flex-wrap gap-2 pt-1">
          {hasJudge ? (
            <>
              {judgePresent ? (
                <Button size="sm" variant="secondary" disabled={pending} onClick={() => setAbsenceDialogOpen(true)} className="text-xs h-8">
                  {pending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                  Mark Absent
                </Button>
              ) : (
                <Button size="sm" variant="default" disabled={pending} onClick={handleMarkPresent} className="text-xs h-8">
                  {pending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                  Mark Present
                </Button>
              )}
              <Button size="sm" variant="outline" disabled={pending} onClick={() => setMoveOpen(true)} className="text-xs h-8">
                <ArrowRightLeft className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <Button size="sm" variant="default" onClick={() => setAssignOpen(true)} className="text-xs h-8">
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              Assign Judge
            </Button>
          )}
        </div>
      )}
      {quickReassignMode && (
        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
          {isSelectedSource ? "Selected as source" : quickReassignSourceId ? "← Tap to move here" : hasJudge ? "Tap to select" : ""}
        </div>
      )}

      <MoveJudgeDialog
        open={moveOpen}
        onOpenChange={setMoveOpen}
        currentRoomId={room.room_id}
        currentJudge={room.assigned_judge}
        actorId={actorId}
        onMoveJudge={onMoveJudge}
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
    </div>
  );
}

// ─── Live Row ───
function LiveRow({ room, actorId, onMoveJudge, onMarkAbsent, onMarkPresent, onMarkClerkPresence, showBuilding, allRooms, quickReassignMode, quickReassignSourceId, onQuickReassignClick }: {
  room: any;
  actorId: string;
  onMoveJudge: (fromRoomId: string | null, toRoomId: string, judgeName: string, actorId: string, isCovering?: boolean) => Promise<void>;
  onMarkAbsent: (roomId: string, role: "judge" | "clerk", actorId: string) => Promise<void>;
  onMarkPresent: (roomId: string, role: "judge" | "clerk", actorId: string) => Promise<void>;
  onMarkClerkPresence: (courtRoomId: string, clerkName: string, present: boolean, actorId: string) => Promise<void>;
  showBuilding: boolean;
  allRooms: any[];
  quickReassignMode: boolean;
  quickReassignSourceId: string | null;
  onQuickReassignClick: (room: any) => void;
}) {
  const { toast } = useToast();
  const judgePresent = room.judge_present || false;
  const clerksCount = room.clerks_present_count || 0;
  const isMaintenance = room.maintenance_status === 'in_progress' || room.operational_status === 'maintenance';
  const statusText = isMaintenance ? 'maintenance' : (room.is_active ? 'open' : 'closed');
  const hasJudge = room.assigned_judge && room.assigned_judge.trim();
  const isSelectedSource = quickReassignSourceId === room.room_id;

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

  const rowClickHandler = quickReassignMode ? () => onQuickReassignClick(room) : undefined;

  return (
    <TableRow
      onClick={rowClickHandler}
      className={[
        quickReassignMode ? 'cursor-pointer hover:bg-blue-500/10 transition-colors' : '',
        isSelectedSource ? 'bg-blue-500/15 ring-2 ring-blue-500/40 ring-inset' : '',
        quickReassignMode && !hasJudge && !quickReassignSourceId ? 'opacity-50' : '',
      ].filter(Boolean).join(' ')}
    >
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
                  <label key={clerk} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-1 rounded" onClick={e => e.stopPropagation()}>
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
        {quickReassignMode ? (
          <div className="text-xs text-muted-foreground">
            {isSelectedSource ? (
              <Badge className="bg-blue-600 text-white">Source</Badge>
            ) : quickReassignSourceId ? (
              <span className="text-blue-600 dark:text-blue-400 font-medium">← Click to move here</span>
            ) : hasJudge ? (
              <span>Click to select</span>
            ) : null}
          </div>
        ) : (
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
        )}

        <MoveJudgeDialog
          open={moveOpen}
          onOpenChange={setMoveOpen}
          currentRoomId={room.room_id}
          currentJudge={room.assigned_judge}
          actorId={actorId}
          onMoveJudge={onMoveJudge}
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
function MoveJudgeDialog({ open, onOpenChange, currentRoomId, currentJudge, actorId, onMoveJudge, currentRoomNumber }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentRoomId: string;
  currentJudge: string | null;
  actorId: string;
  onMoveJudge: (fromRoomId: string | null, toRoomId: string, judgeName: string, actorId: string, isCovering?: boolean) => Promise<void>;
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

  const groupedRooms = useMemo(() => {
    if (!rooms) return {};
    const filtered = rooms.filter((r: any) => {
      if (r.room_id === currentRoomId) return false;
      if (!r.is_active) return false;
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

  const destinationRoom = useMemo(() => {
    if (!toRoom || !rooms) return null;
    return rooms.find((r: any) => r.room_id === toRoom) as any;
  }, [toRoom, rooms]);
  const willDisplace = isReassign && destinationRoom?.assigned_judge?.trim();

  const handleMoveJudge = async () => {
    setSaving(true);
    try {
      const toRoomData = rooms?.find((r: any) => r.room_id === toRoom) as any;

      if (isReassign) {
        const { error: destErr } = await supabase
          .from("court_assignments")
          .update({ justice: judgeName })
          .eq("room_id", toRoom);
        if (destErr) throw destErr;

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
              {isReassign ? '📌 Confirm Reassign' : isSwap ? '🔀 Confirm Swap' : '➡️ Confirm Move'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LiveCourtGrid;

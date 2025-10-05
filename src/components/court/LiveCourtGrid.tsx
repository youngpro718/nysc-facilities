import { useMemo, useState, useEffect } from "react";
import { useCourtOperationsRealtime, useCourtPresence, useRoomStatus, useCourtRooms, useStaffOutToday } from "@/hooks/useCourtOperationsRealtime";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, AlertTriangle, CheckCircle2, XCircle, Users, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [pending, setPending] = useState(false);

  const handleMarkPresent = async () => {
    setPending(true);
    console.log('Marking present:', { court_room_id: room.id, room_id: room.room_id, judge: room.assigned_judge, actorId });
    try {
      await onMarkPresent(room.id, 'judge', actorId); // Use room.id (court_rooms.id) not room.room_id
      toast({
        title: "Judge marked present",
        description: `${room.assigned_judge || 'Judge'} marked present in room ${room.room_number}`,
      });
    } catch (error: any) {
      console.error('Mark present error:', error);
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
    setPending(true);
    console.log('Marking absent:', { court_room_id: room.id, room_id: room.room_id, judge: room.assigned_judge, actorId });
    try {
      await onMarkAbsent(room.id, 'judge', actorId); // Use room.id (court_rooms.id) not room.room_id
      toast({
        title: "Judge marked absent",
        description: `${room.assigned_judge || 'Judge'} marked absent from room ${room.room_number}`,
      });
    } catch (error: any) {
      console.error('Mark absent error:', error);
      toast({
        title: "Failed to mark judge absent",
        description: error?.message || String(error) || "An error occurred",
        variant: "destructive",
      });
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
            <div className="text-xs font-medium text-blue-600">Part {room.assigned_part}</div>
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
                <span className={`text-xs ${judgePresent ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}`}>
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
                        } catch (error: any) {
                          console.error('Clerk presence error:', error);
                          toast({ title: "Error", description: error?.message || "Failed to update clerk presence", variant: "destructive" });
                        }
                      }}
                      className="h-3 w-3"
                    />
                    <span className={isPresent ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>
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
  const { data: rooms } = useCourtRooms();
  const [judgeName, setJudgeName] = useState(currentJudge || "");
  const [toRoom, setToRoom] = useState<string>("");
  const [isCovering, setIsCovering] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Update judge name when dialog opens with current judge
  useEffect(() => {
    if (open && currentJudge) {
      setJudgeName(currentJudge);
    }
  }, [open, currentJudge]);

  const handleMoveJudge = async () => {
    setSaving(true);
    console.log('Move Judge clicked:', { 
      currentRoomId, 
      toRoom, 
      judgeName, 
      actorId,
      hasJudgeName: !!judgeName,
      hasToRoom: !!toRoom
    });
    
    try {
      const fromRoom = rooms?.find(r => r.room_id === currentRoomId);
      const toRoomData = rooms?.find(r => r.room_id === toRoom);
      
      console.log('Calling onMoveJudge with:', {
        from: currentRoomId,
        to: toRoom,
        judge: judgeName,
        actor: actorId,
        isCovering
      });
      
      await onMoveJudge(currentRoomId, toRoom, judgeName, actorId, isCovering);
      
      console.log('Move judge successful!');
      
      const moveType = isCovering ? 'covering' : 'moving entire part to';
      toast({
        title: "Judge moved successfully",
        description: `${judgeName} ${moveType} room ${toRoomData?.room_number}`,
      });
      
      onOpenChange(false);
      setJudgeName("");
      setToRoom("");
    } catch (error: any) {
      console.error('Move judge error:', error);
      toast({
        title: "Failed to move judge",
        description: error?.message || String(error) || "An error occurred while moving the judge",
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
                  .filter((r: any) => {
                    // Only show active rooms that are EMPTY (no judge assigned)
                    if (r.room_id === currentRoomId) return false; // Compare room_id
                    if (!r.is_active) return false;
                    if (r.assigned_judge && r.assigned_judge.trim()) return false; // Has a judge, exclude it
                    return true; // Empty room, show it
                  })
                  .map((r: any) => (
                    <SelectItem key={r.room_id} value={r.room_id}>
                      {r.room_number}
                      {r.courtroom_number ? ` · Court ${r.courtroom_number}` : ""}
                      {' (Available)'}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2 p-3 bg-muted/50 rounded-md">
            <label className="block text-sm font-medium">Move Type</label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="radio" 
                  checked={!isCovering} 
                  onChange={() => setIsCovering(false)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-sm">Move Entire Part</div>
                  <div className="text-xs text-muted-foreground">
                    Moves judge, clerks, part number, and all courtroom details to the new room
                  </div>
                </div>
              </label>
              
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="radio" 
                  checked={isCovering} 
                  onChange={() => setIsCovering(true)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-sm">Covering Another Part</div>
                  <div className="text-xs text-muted-foreground">
                    Judge temporarily covers destination room, keeps their original part number
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" disabled={!judgeName || !toRoom || saving} onClick={handleMoveJudge}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirm Move
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LiveCourtGrid;

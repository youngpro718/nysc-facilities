import { useMemo, useState } from "react";
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
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const actorId = user?.id || "";

  const { data: rooms, isLoading } = useCourtRooms();
  const staffOut = useStaffOutToday();
  const { onMoveJudge, onMarkAbsent, onMarkPresent } = useCourtOperationsRealtime();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showImpacted, setShowImpacted] = useState(false);

  const filteredRooms = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (rooms || []).filter((r: any) => {
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
            <Badge variant="secondary">Judges out today: {staffOut.filter(s => s.role === 'judge').length}</Badge>
            <Badge variant="secondary">Clerks out today: {staffOut.filter(s => s.role === 'clerk').length}</Badge>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Judge</TableHead>
                <TableHead>Clerks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRooms.map((room: any) => (
                <LiveRow key={room.id} room={room} actorId={actorId} onMoveJudge={onMoveJudge} onMarkAbsent={onMarkAbsent} onMarkPresent={onMarkPresent} />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function LiveRow({ room, actorId, onMoveJudge, onMarkAbsent, onMarkPresent }: {
  room: any;
  actorId: string;
  onMoveJudge: (fromRoomId: string | null, toRoomId: string, judgeName: string, actorId: string) => Promise<void>;
  onMarkAbsent: (roomId: string, role: "judge" | "clerk", actorId: string) => Promise<void>;
  onMarkPresent: (roomId: string, role: "judge" | "clerk", actorId: string) => Promise<void>;
}) {
  const { toast } = useToast();
  
  // Presence + status queries per row
  const presence = useCourtPresence(room.id);
  const status = useRoomStatus(room.id);

  const judgePresent = !!presence?.judge_present;
  const clerksCount = presence?.clerks_present_count ?? 0;
  const statusText = status?.status || (room.is_active ? 'open' : 'closed');

  const [moveOpen, setMoveOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const handleMarkPresent = async () => {
    setPending(true);
    try {
      await onMarkPresent(room.id, 'judge', actorId);
      toast({
        title: "Judge marked present",
        description: `Judge presence updated for room ${room.room_number}`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to mark judge present",
        description: error?.message || "An error occurred while updating judge presence",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  };

  const handleMarkAbsent = async () => {
    setPending(true);
    try {
      await onMarkAbsent(room.id, 'judge', actorId);
      toast({
        title: "Judge marked absent",
        description: `Judge presence updated for room ${room.room_number}`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to mark judge absent",
        description: error?.message || "An error occurred while updating judge presence",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{room.room_number}</div>
        {room.courtroom_number && (
          <div className="text-xs text-muted-foreground">Court {room.courtroom_number}</div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <PresenceDot present={judgePresent} />
          <span className="text-sm">{judgePresent ? 'Present' : 'Absent'}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm">{clerksCount} present</span>
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
        <div className="flex items-center justify-end gap-2">
          {judgePresent ? (
            <Button size="sm" variant="secondary" disabled={pending} onClick={handleMarkAbsent}>
              {pending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
              Judge Absent
            </Button>
          ) : (
            <Button size="sm" variant="default" disabled={pending} onClick={handleMarkPresent}>
              {pending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              Judge Present
            </Button>
          )}

          <Button size="sm" variant="outline" disabled={pending || statusText === 'maintenance'} onClick={() => setMoveOpen(true)}>
            <ArrowRightLeft className="h-4 w-4 mr-1" /> Move Judge
          </Button>

          <MoveJudgeDialog open={moveOpen} onOpenChange={setMoveOpen} currentRoomId={room.id} actorId={actorId} onMoveJudge={onMoveJudge} />
        </div>
      </TableCell>
    </TableRow>
  );
}

function MoveJudgeDialog({ open, onOpenChange, currentRoomId, actorId, onMoveJudge }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentRoomId: string;
  actorId: string;
  onMoveJudge: (fromRoomId: string | null, toRoomId: string, judgeName: string, actorId: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const { data: rooms } = useCourtRooms();
  const [judgeName, setJudgeName] = useState("");
  const [toRoom, setToRoom] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const handleMoveJudge = async () => {
    setSaving(true);
    try {
      const fromRoom = rooms?.find(r => r.id === currentRoomId);
      const toRoomData = rooms?.find(r => r.id === toRoom);
      
      await onMoveJudge(currentRoomId, toRoom, judgeName, actorId);
      
      toast({
        title: "Judge moved successfully",
        description: `${judgeName} moved from ${fromRoom?.room_number} to ${toRoomData?.room_number}`,
      });
      
      onOpenChange(false);
      setJudgeName("");
      setToRoom("");
    } catch (error: any) {
      toast({
        title: "Failed to move judge",
        description: error?.message || "An error occurred while moving the judge",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move Judge</DialogTitle>
          <DialogDescription>Pick a destination room and confirm the judge's name. The source room will be cleared automatically.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
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
                {(rooms || []).map((r: any) => (
                  <SelectItem key={r.id} value={r.id} disabled={r.id === currentRoomId}>
                    {r.room_number}{r.courtroom_number ? ` · Court ${r.courtroom_number}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

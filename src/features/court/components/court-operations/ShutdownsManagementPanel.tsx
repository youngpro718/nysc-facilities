import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ModalFrame } from "@shared/components/common/common/ModalFrame";
import {
  AlertTriangle,
  CheckCircle,
  Plus,
  Construction,
  Calendar,
  Clock,
} from "lucide-react";
import { useToast } from "@shared/hooks/use-toast";
import { format } from "date-fns";
import { QUERY_CONFIG } from '@/config';
import { QUERY_KEYS } from '@/lib/queryKeys';

interface Shutdown {
  id: string;
  court_room_id: string;
  title: string;
  reason: string;
  description: string | null;
  status: string;
  impact_level: string | null;
  start_date: string;
  end_date: string | null;
  temporary_location: string | null;
  created_at: string;
  court_rooms: { room_number: string; courtroom_number: string | null } | null;
}

export const ShutdownsManagementPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: shutdowns, isLoading } = useQuery({
    queryKey: ["shutdowns-management", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("room_shutdowns")
        .select("id, court_room_id, title, reason, description, status, impact_level, start_date, end_date, temporary_location, created_at, court_rooms(room_number, courtroom_number)")
        .order("created_at", { ascending: false });

      if (statusFilter === "active") {
        query = query.in("status", ["scheduled", "in_progress"]);
      } else if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Shutdown[];
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("room_shutdowns")
        .update({ status: "completed" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Shutdown resolved", description: "Room is back to normal operations." });
      queryClient.invalidateQueries({ queryKey: ["shutdowns-management"] });
      queryClient.invalidateQueries({ queryKey: ["room-shutdowns-active"] });
      queryClient.invalidateQueries({ queryKey: ["room-shutdowns-detail"] });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const statusColors: Record<string, string> = {
    scheduled: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    in_progress: "bg-destructive/10 text-destructive",
    completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    cancelled: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Construction className="h-5 w-5" />
            Room Shutdowns
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage room shutdowns and maintenance periods
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <CreateShutdownDialog open={createOpen} onOpenChange={setCreateOpen} />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading shutdowns...</div>
      ) : !shutdowns?.length ? (
        <div className="text-center py-12 space-y-2">
          <CheckCircle className="h-10 w-10 mx-auto text-emerald-500/50" />
          <p className="text-muted-foreground text-sm">
            {statusFilter === "active"
              ? "No active shutdowns — all rooms operational"
              : "No shutdowns found for this filter"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {shutdowns.map((s) => (
            <div
              key={s.id}
              className="border rounded-lg p-4 space-y-2 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      Room {s.court_rooms?.room_number || "?"}
                    </span>
                    {s.court_rooms?.courtroom_number && (
                      <Badge variant="outline" className="text-[10px]">
                        Ct {s.court_rooms.courtroom_number}
                      </Badge>
                    )}
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[s.status] || "bg-muted text-muted-foreground"}`}>
                      {s.status.replace("_", " ")}
                    </span>
                    {s.impact_level && (
                      <Badge variant={s.impact_level === "high" ? "destructive" : "secondary"} className="text-[10px]">
                        {s.impact_level} impact
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.reason}</p>
                  {s.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(s.start_date), "MMM d, yyyy")}
                      {s.end_date && ` — ${format(new Date(s.end_date), "MMM d, yyyy")}`}
                    </span>
                    {s.temporary_location && (
                      <span className="flex items-center gap-1">
                        → Temp: {s.temporary_location}
                      </span>
                    )}
                  </div>
                </div>
                {(s.status === "scheduled" || s.status === "in_progress") && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 h-8 text-xs"
                    disabled={resolveMutation.isPending}
                    onClick={() => resolveMutation.mutate(s.id)}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Resolve
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Create Shutdown Dialog ─── */

const CreateShutdownDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    court_room_id: "",
    title: "",
    reason: "",
    description: "",
    impact_level: "medium",
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: "",
    temporary_location: "",
  });

  const { data: courtRooms } = useQuery({
    queryKey: QUERY_KEYS.courtRoomsList(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("court_rooms")
        .select("id, room_number, courtroom_number")
        .eq("is_active", true)
        .order("room_number");
      if (error) throw error;
      return data || [];
    },
    staleTime: QUERY_CONFIG.stale.long,
    gcTime: QUERY_CONFIG.gc.long,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("room_shutdowns").insert({
        court_room_id: form.court_room_id,
        title: form.title || form.reason,
        reason: form.reason,
        description: form.description || null,
        impact_level: form.impact_level,
        start_date: form.start_date,
        end_date: form.end_date || null,
        temporary_location: form.temporary_location || null,
        status: "scheduled",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Shutdown created", description: "Room shutdown has been scheduled." });
      queryClient.invalidateQueries({ queryKey: ["shutdowns-management"] });
      queryClient.invalidateQueries({ queryKey: ["room-shutdowns-active"] });
      onOpenChange(false);
      setForm({
        court_room_id: "",
        title: "",
        reason: "",
        description: "",
        impact_level: "medium",
        start_date: format(new Date(), "yyyy-MM-dd"),
        end_date: "",
        temporary_location: "",
      });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const canSubmit = form.court_room_id && form.reason && form.start_date;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" />
          New Shutdown
        </Button>
      </DialogTrigger>
      <ModalFrame
        size="sm"
        title={
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Schedule Room Shutdown
          </span>
        }
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Room *</Label>
            <Select value={form.court_room_id} onValueChange={(v) => setForm((p) => ({ ...p, court_room_id: v }))}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select room..." />
              </SelectTrigger>
              <SelectContent>
                {courtRooms?.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    Room {r.room_number}
                    {r.courtroom_number ? ` (Ct ${r.courtroom_number})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input
              className="h-9"
              placeholder="e.g. Elevator renovation"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Reason *</Label>
            <Select value={form.reason} onValueChange={(v) => setForm((p) => ({ ...p, reason: v }))}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select reason..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Renovation">Renovation</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea
              className="min-h-[60px] text-sm"
              placeholder="Additional details..."
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Date *</Label>
              <Input
                type="date"
                className="h-9 text-sm"
                value={form.start_date}
                onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">End Date</Label>
              <Input
                type="date"
                className="h-9 text-sm"
                value={form.end_date}
                onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Impact Level</Label>
              <Select value={form.impact_level} onValueChange={(v) => setForm((p) => ({ ...p, impact_level: v }))}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Temp Location</Label>
              <Input
                className="h-9 text-sm"
                placeholder="Room #"
                value={form.temporary_location}
                onChange={(e) => setForm((p) => ({ ...p, temporary_location: e.target.value }))}
              />
            </div>
          </div>

          <Button
            className="w-full"
            disabled={!canSubmit || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? "Creating..." : "Schedule Shutdown"}
          </Button>
        </div>
      </ModalFrame>
    </Dialog>
  );
};

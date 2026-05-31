import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { getErrorMessage } from "@/lib/errorUtils";
import { toast } from "sonner";
import { Search, KeyRound, ClipboardList, X, ArrowLeft, CheckCircle2, LogIn, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { LockboxSlot } from "../components/keys/types/LockboxTypes";

type Tab = "find" | "out";
type Category = "all" | "chambers" | "robing" | "courtroom" | "other";

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "all", label: "All" },
  { id: "chambers", label: "Chambers" },
  { id: "robing", label: "Robing Rooms" },
  { id: "courtroom", label: "Courtrooms" },
  { id: "other", label: "Other" },
];

interface EnrichedSlot extends LockboxSlot {
  lockbox_name?: string;
  checked_out_to?: string | null;
  checked_out_at?: string | null;
}

function categorize(s: EnrichedSlot): Category {
  const hay = `${s.label || ""} ${s.room_number || ""}`.toLowerCase();
  if (hay.includes("chamber")) return "chambers";
  if (hay.includes("robing")) return "robing";
  if (hay.includes("courtroom") || hay.includes("court room") || /\bpart\b/.test(hay) || /\bctrm\b/.test(hay)) return "courtroom";
  return "other";
}

function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function KeysKiosk() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("find");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [actionSlot, setActionSlot] = useState<EnrichedSlot | null>(null);
  const [personName, setPersonName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const lockboxesQuery = useQuery({
    queryKey: ["kiosk-lockboxes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lockboxes").select("id, name").order("name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const slotsQuery = useQuery({
    queryKey: ["kiosk-slots"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lockbox_slots").select("*").order("slot_number");
      if (error) throw error;
      return (data || []) as LockboxSlot[];
    },
    refetchInterval: 15000,
  });

  const checkoutLogsQuery = useQuery({
    queryKey: ["kiosk-checkout-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lockbox_activity_logs")
        .select("slot_id, action, actor_name, created_at")
        .eq("action", "check_out")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) {
        logger.warn("kiosk logs", error);
        return [];
      }
      return data as Array<{ slot_id: string; actor_name?: string; created_at: string }>;
    },
    refetchInterval: 15000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("kiosk_keys")
      .on("postgres_changes", { event: "*", schema: "public", table: "lockbox_slots" }, () => slotsQuery.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "lockbox_activity_logs" }, () => checkoutLogsQuery.refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slots: EnrichedSlot[] = useMemo(() => {
    const lbMap = new Map((lockboxesQuery.data || []).map((lb) => [lb.id, lb.name]));
    const latest = new Map<string, { actor_name?: string; created_at: string }>();
    for (const log of checkoutLogsQuery.data || []) {
      if (!latest.has(log.slot_id)) latest.set(log.slot_id, { actor_name: log.actor_name, created_at: log.created_at });
    }
    return (slotsQuery.data || []).map((s) => {
      const co = s.status === "checked_out" ? latest.get(s.id) : undefined;
      return {
        ...s,
        lockbox_name: lbMap.get(s.lockbox_id),
        checked_out_to: co?.actor_name ?? null,
        checked_out_at: co?.created_at ?? null,
      };
    });
  }, [slotsQuery.data, lockboxesQuery.data, checkoutLogsQuery.data]);

  const filteredFind = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = slots;
    if (category !== "all") {
      list = list.filter((s) => categorize(s) === category);
    }
    if (q) {
      list = list.filter((s) =>
        s.label.toLowerCase().includes(q) ||
        String(s.slot_number).includes(q) ||
        (s.room_number || "").toLowerCase().includes(q) ||
        (s.lockbox_name || "").toLowerCase().includes(q)
      );
    }
    return q ? list : list.slice(0, 100);
  }, [slots, query, category]);

  const categoryCounts = useMemo(() => {
    const counts: Record<Category, number> = { all: slots.length, chambers: 0, robing: 0, courtroom: 0, other: 0 };
    for (const s of slots) counts[categorize(s)]++;
    return counts;
  }, [slots]);


  const out = useMemo(
    () => slots.filter((s) => s.status === "checked_out").sort((a, b) =>
      (b.checked_out_at || "").localeCompare(a.checked_out_at || "")
    ),
    [slots]
  );

  const refetchAll = () => { slotsQuery.refetch(); checkoutLogsQuery.refetch(); };

  const openAction = (s: EnrichedSlot) => {
    setActionSlot(s);
    setPersonName("");
  };

  const submitAction = async (newStatus: "checked_out" | "in_box") => {
    if (!actionSlot) return;
    if (newStatus === "checked_out" && !personName.trim()) {
      toast.error("Enter the name of the person taking the key");
      return;
    }
    setSubmitting(true);
    try {
      const { error: updErr } = await supabase
        .from("lockbox_slots")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", actionSlot.id);
      if (updErr) throw updErr;

      const { data: { user } } = await supabase.auth.getUser();
      const { error: logErr } = await supabase
        .from("lockbox_activity_logs")
        .insert({
          slot_id: actionSlot.id,
          action: newStatus === "in_box" ? "check_in" : "check_out",
          status_before: actionSlot.status,
          status_after: newStatus,
          actor_user_id: user?.id,
          actor_name: personName.trim() || user?.email,
        });
      if (logErr) throw logErr;

      toast.success(newStatus === "in_box" ? "Key checked in" : "Key checked out");
      setActionSlot(null);
      setPersonName("");
      refetchAll();
    } catch (e) {
      logger.error("kiosk action", e);
      toast.error(getErrorMessage(e) || "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  const loading = slotsQuery.isLoading || lockboxesQuery.isLoading;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <KeyRound className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold leading-tight">Key Kiosk</div>
              <div className="text-sm text-muted-foreground">Tap to find a key or check one in</div>
            </div>
          </div>
          <Button
            variant="outline"
            size="lg"
            className="h-14 px-6 text-base rounded-xl"
            onClick={() => navigate("/keys")}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Exit Kiosk
          </Button>
        </div>

        {/* Big tab buttons */}
        <div className="grid grid-cols-2 gap-3 px-6 pb-4">
          <button
            onClick={() => setTab("find")}
            className={cn(
              "h-20 rounded-2xl border-2 flex items-center justify-center gap-3 text-xl font-semibold transition-all active:scale-[0.98]",
              tab === "find"
                ? "bg-primary text-primary-foreground border-primary shadow-lg"
                : "bg-card text-foreground border-border hover:border-primary/50"
            )}
          >
            <Search className="h-7 w-7" />
            Find a Key
          </button>
          <button
            onClick={() => setTab("out")}
            className={cn(
              "h-20 rounded-2xl border-2 flex items-center justify-center gap-3 text-xl font-semibold transition-all active:scale-[0.98] relative",
              tab === "out"
                ? "bg-primary text-primary-foreground border-primary shadow-lg"
                : "bg-card text-foreground border-border hover:border-primary/50"
            )}
          >
            <ClipboardList className="h-7 w-7" />
            Keys Out
            <span className={cn(
              "ml-2 inline-flex items-center justify-center min-w-[2.5rem] h-9 rounded-full px-3 text-base font-bold",
              tab === "out" ? "bg-primary-foreground text-primary" : "bg-muted text-foreground"
            )}>
              {out.length}
            </span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : tab === "find" ? (
          <FindTab
            query={query}
            setQuery={setQuery}
            category={category}
            setCategory={setCategory}
            counts={categoryCounts}
            results={filteredFind}
            onAction={openAction}
          />

        ) : (
          <OutTab list={out} onCheckIn={openAction} />
        )}
      </div>

      {/* Action dialog */}
      <Dialog open={!!actionSlot} onOpenChange={(o) => !o && setActionSlot(null)}>
        <DialogContent className="max-w-lg">
          {actionSlot && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {actionSlot.room_number ? `Room ${actionSlot.room_number}` : actionSlot.label}
                </DialogTitle>
                <DialogDescription className="text-base">
                  {actionSlot.lockbox_name} · Slot {actionSlot.slot_number}
                  {actionSlot.label && actionSlot.room_number ? ` · ${actionSlot.label}` : ""}
                </DialogDescription>
              </DialogHeader>

              {actionSlot.status === "checked_out" ? (
                <div className="space-y-4 py-2">
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-base">
                    <div className="font-semibold text-foreground">Currently with</div>
                    <div className="text-xl font-bold text-foreground">{actionSlot.checked_out_to || "Unknown"}</div>
                    <div className="text-sm text-muted-foreground mt-1">{timeAgo(actionSlot.checked_out_at)}</div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" size="lg" className="h-14 text-base" onClick={() => setActionSlot(null)}>
                      Cancel
                    </Button>
                    <Button size="lg" className="h-14 text-base flex-1" disabled={submitting} onClick={() => submitAction("in_box")}>
                      {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5 mr-2" />Check In</>}
                    </Button>
                  </DialogFooter>
                </div>
              ) : actionSlot.status === "in_box" ? (
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label className="text-base">Name of person taking the key</Label>
                    <Input
                      autoFocus
                      placeholder="e.g. Officer Smith"
                      value={personName}
                      onChange={(e) => setPersonName(e.target.value)}
                      className="h-14 text-lg"
                    />
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" size="lg" className="h-14 text-base" onClick={() => setActionSlot(null)}>
                      Cancel
                    </Button>
                    <Button size="lg" className="h-14 text-base flex-1" disabled={submitting} onClick={() => submitAction("checked_out")}>
                      {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><LogOut className="h-5 w-5 mr-2" />Check Out</>}
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="py-4 text-center text-muted-foreground">
                  This key is marked <span className="font-semibold text-foreground">{actionSlot.status}</span>. Use the full Keys page to update.
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function statusPill(status: string) {
  if (status === "in_box") return { label: "Available", cls: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30" };
  if (status === "checked_out") return { label: "Checked Out", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" };
  if (status === "missing") return { label: "Missing", cls: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30" };
  return { label: status, cls: "bg-muted text-foreground border-border" };
}

function FindTab({
  query, setQuery, results, onAction,
}: {
  query: string;
  setQuery: (v: string) => void;
  results: EnrichedSlot[];
  onAction: (s: EnrichedSlot) => void;
}) {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search room number, key label, or lockbox…"
          className="h-20 pl-16 pr-16 text-2xl rounded-2xl border-2"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12"
            onClick={() => setQuery("")}
          >
            <X className="h-6 w-6" />
          </Button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <KeyRound className="h-14 w-14 mx-auto mb-3 opacity-40" />
          <div className="text-lg">No keys match "{query}"</div>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((s) => {
            const pill = statusPill(s.status);
            const isOut = s.status === "checked_out";
            const isAvail = s.status === "in_box";
            return (
              <button
                key={s.id}
                onClick={() => onAction(s)}
                className="w-full text-left bg-card border-2 border-border hover:border-primary/50 rounded-2xl p-5 transition-all active:scale-[0.99] flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-2xl font-bold text-foreground">
                      {s.room_number ? `Room ${s.room_number}` : s.label}
                    </div>
                    <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border", pill.cls)}>
                      {pill.label}
                    </span>
                  </div>
                  <div className="text-base text-muted-foreground mt-1">
                    {s.lockbox_name} · Slot {s.slot_number}
                    {s.room_number && s.label ? ` · ${s.label}` : ""}
                  </div>
                  {isOut && (
                    <div className="text-base text-foreground mt-1">
                      With <span className="font-semibold">{s.checked_out_to || "Unknown"}</span>
                      <span className="text-muted-foreground"> · {timeAgo(s.checked_out_at)}</span>
                    </div>
                  )}
                </div>
                <div className={cn(
                  "shrink-0 h-14 px-5 rounded-xl flex items-center gap-2 font-semibold text-base",
                  isAvail ? "bg-primary text-primary-foreground" :
                  isOut ? "bg-green-600 text-white" :
                  "bg-muted text-muted-foreground"
                )}>
                  {isAvail ? <><LogOut className="h-5 w-5" />Check Out</> :
                   isOut ? <><LogIn className="h-5 w-5" />Check In</> :
                   "View"}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OutTab({ list, onCheckIn }: { list: EnrichedSlot[]; onCheckIn: (s: EnrichedSlot) => void }) {
  if (list.length === 0) {
    return (
      <div className="text-center py-24 text-muted-foreground max-w-md mx-auto">
        <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500/60" />
        <div className="text-2xl font-semibold text-foreground">All keys are in</div>
        <div className="text-base mt-2">Nothing is currently checked out.</div>
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto space-y-3">
      {list.map((s) => (
        <div key={s.id} className="bg-card border-2 border-amber-500/30 rounded-2xl p-5 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-foreground">
              {s.room_number ? `Room ${s.room_number}` : s.label}
            </div>
            <div className="text-base text-muted-foreground">
              {s.lockbox_name} · Slot {s.slot_number}
            </div>
            <div className="text-lg text-foreground mt-1">
              With <span className="font-bold">{s.checked_out_to || "Unknown"}</span>
              <span className="text-muted-foreground text-base"> · {timeAgo(s.checked_out_at)}</span>
            </div>
          </div>
          <Button
            size="lg"
            className="h-16 px-6 text-base rounded-xl bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onCheckIn(s)}
          >
            <LogIn className="h-5 w-5 mr-2" />
            Check In
          </Button>
        </div>
      ))}
    </div>
  );
}

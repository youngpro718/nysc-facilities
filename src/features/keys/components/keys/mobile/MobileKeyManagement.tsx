import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { LockboxSlot } from "../types/LockboxTypes";
import { LockboxSlotDialog } from "../lockbox/LockboxSlotDialog";
import { EditSlotDialog } from "../lockbox/EditSlotDialog";
import { CreateKeyDialog } from "../CreateKeyDialog";
import { MobileKeyHeader } from "./MobileKeyHeader";
import { MobileKeySearch } from "./MobileKeySearch";
import {
  MobileKeyStatusChips,
  StatusChipKey,
} from "./MobileKeyStatusChips";
import { MobileKeyBoxOverview, BoxOverviewItem } from "./MobileKeyBoxOverview";
import { MobileKeyRow, MobileSlotRowData } from "./MobileKeyRow";
import { useRolePermissions } from "@features/auth/hooks/useRolePermissions";

export function MobileKeyManagement() {
  const navigate = useNavigate();
  const { canAdmin } = useRolePermissions();
  const canManageKeys = canAdmin("keys");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusChipKey>("all");
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<MobileSlotRowData | null>(null);
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [editSlotOpen, setEditSlotOpen] = useState(false);
  const [createKeyOpen, setCreateKeyOpen] = useState(false);

  // Lockboxes
  const lockboxesQuery = useQuery({
    queryKey: ["mobile-keys-lockboxes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lockboxes")
        .select("id, name")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  // Slots
  const slotsQuery = useQuery({
    queryKey: ["mobile-keys-slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lockbox_slots")
        .select("*")
        .order("slot_number", { ascending: true });
      if (error) throw error;
      return (data || []) as LockboxSlot[];
    },
  });

  // Latest checkout activity per slot (for "Checked out to … · date" line)
  const checkoutLogsQuery = useQuery({
    queryKey: ["mobile-keys-checkout-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lockbox_activity_logs")
        .select("slot_id, action, actor_name, created_at")
        .eq("action", "check_out")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) {
        logger.warn("Failed to load checkout logs", error);
        return [];
      }
      return data as Array<{
        slot_id: string;
        action: string;
        actor_name?: string;
        created_at: string;
      }>;
    },
  });

  const refetchAll = () => {
    slotsQuery.refetch();
    checkoutLogsQuery.refetch();
  };

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("mobile_keys_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lockbox_slots" },
        () => slotsQuery.refetch(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lockbox_activity_logs" },
        () => checkoutLogsQuery.refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build per-slot enriched rows
  const allSlots: MobileSlotRowData[] = useMemo(() => {
    const lbMap = new Map(
      (lockboxesQuery.data || []).map((lb) => [lb.id, lb.name]),
    );
    const latestBySlot = new Map<
      string,
      { actor_name?: string; created_at: string }
    >();
    for (const log of checkoutLogsQuery.data || []) {
      if (!latestBySlot.has(log.slot_id)) {
        latestBySlot.set(log.slot_id, {
          actor_name: log.actor_name,
          created_at: log.created_at,
        });
      }
    }
    return (slotsQuery.data || []).map((s) => {
      const checkout =
        s.status === "checked_out" ? latestBySlot.get(s.id) : undefined;
      return {
        ...s,
        lockbox_name: lbMap.get(s.lockbox_id),
        checked_out_to: checkout?.actor_name ?? null,
        checked_out_at: checkout?.created_at ?? null,
      };
    });
  }, [slotsQuery.data, lockboxesQuery.data, checkoutLogsQuery.data]);

  // Box overview
  const boxes: BoxOverviewItem[] = useMemo(() => {
    return (lockboxesQuery.data || []).map((lb) => {
      const slotsForBox = allSlots.filter((s) => s.lockbox_id === lb.id);
      const used = slotsForBox.filter(
        (s) => s.status === "checked_out" || s.status === "in_box",
      ).length;
      return {
        id: lb.id,
        name: lb.name,
        used,
        total: slotsForBox.length,
      };
    });
  }, [lockboxesQuery.data, allSlots]);

  // Counts (across box scope)
  const boxScopedSlots = useMemo(() => {
    return selectedBoxId
      ? allSlots.filter((s) => s.lockbox_id === selectedBoxId)
      : allSlots;
  }, [allSlots, selectedBoxId]);

  const counts = useMemo(
    () => ({
      all: boxScopedSlots.length,
      available: boxScopedSlots.filter((s) => s.status === "in_box").length,
      checked_out: boxScopedSlots.filter((s) => s.status === "checked_out")
        .length,
      missing: boxScopedSlots.filter((s) => s.status === "missing").length,
    }),
    [boxScopedSlots],
  );

  // Final filtered list
  const visibleSlots = useMemo(() => {
    const q = query.trim().toLowerCase();
    return boxScopedSlots.filter((s) => {
      // status chip
      if (statusFilter === "available" && s.status !== "in_box") return false;
      if (statusFilter === "checked_out" && s.status !== "checked_out")
        return false;
      if (statusFilter === "missing" && s.status !== "missing") return false;
      // search
      if (!q) return true;
      return (
        s.label.toLowerCase().includes(q) ||
        String(s.slot_number).includes(q) ||
        (s.room_number || "").toLowerCase().includes(q) ||
        (s.lockbox_name || "").toLowerCase().includes(q)
      );
    });
  }, [boxScopedSlots, statusFilter, query]);

  const handleOpenSlot = (slot: MobileSlotRowData) => {
    setSelectedSlot(slot);
    setSlotDialogOpen(true);
  };

  const handlePrimaryAction = (slot: MobileSlotRowData) => {
    setSelectedSlot(slot);
    // "Assign Room" → open the edit dialog, all other states → open the action dialog
    const noRoom = !slot.room_id && !slot.room_number;
    if (slot.status === "in_box" && noRoom) {
      setEditSlotOpen(true);
    } else {
      setSlotDialogOpen(true);
    }
  };

  const isLoading =
    slotsQuery.isLoading || lockboxesQuery.isLoading;

  return (
    <div className="flex flex-col h-full pb-safe">
      <div className="px-4 pt-2 pb-3 space-y-4">
        <MobileKeyHeader />
        <MobileKeySearch value={query} onChange={setQuery} />
        <MobileKeyStatusChips
          active={statusFilter}
          onChange={setStatusFilter}
          counts={counts}
        />
      </div>

      {boxes.length > 0 && (
        <div className="px-4 pb-3">
          <MobileKeyBoxOverview
            boxes={boxes}
            selectedId={selectedBoxId}
            onSelect={setSelectedBoxId}
          />
        </div>
      )}

      <div className="flex items-center justify-between px-4 pb-2">
        <div className="text-sm text-muted-foreground">
          {visibleSlots.length} {visibleSlots.length === 1 ? "key" : "keys"}
        </div>
        <button
          className="text-sm text-muted-foreground"
          onClick={() => navigate("/keys")}
          aria-label="Sort"
        >
          Sort: Slot
        </button>
      </div>

      <ScrollArea className="flex-1 px-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : visibleSlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <KeyRound className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No keys match.</p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {visibleSlots.map((s) => (
              <MobileKeyRow
                key={s.id}
                slot={s}
                onOpen={handleOpenSlot}
                onPrimaryAction={handlePrimaryAction}
              />
            ))}
          </div>
        )}

        {canManageKeys && (
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl border-2 border-dashed border-primary/40 text-primary hover:bg-primary/5 mb-4"
            onClick={() => setCreateKeyOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add / Register New Key
          </Button>
        )}
      </ScrollArea>

      <LockboxSlotDialog
        slot={selectedSlot}
        open={slotDialogOpen}
        onOpenChange={setSlotDialogOpen}
        onSuccess={refetchAll}
        lockboxName={selectedSlot?.lockbox_name}
      />

      <EditSlotDialog
        slot={selectedSlot}
        open={editSlotOpen}
        onOpenChange={setEditSlotOpen}
        onSuccess={refetchAll}
      />

      <CreateKeyDialog
        open={createKeyOpen}
        onOpenChange={setCreateKeyOpen}
        onSuccess={refetchAll}
      />
    </div>
  );
}

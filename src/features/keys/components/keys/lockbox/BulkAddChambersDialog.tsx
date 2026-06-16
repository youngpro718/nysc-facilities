import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Building2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { getErrorMessage } from "@/lib/errorUtils";
import { ModalFrame } from "@shared/components/common/common/ModalFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BulkAddChambersDialogProps {
  lockboxId: string;
  lockboxName?: string;
  existingSlotCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ChamberRoom {
  id: string;
  room_number: string;
  name: string | null;
  floor_id: string | null;
  floors?: {
    name: string | null;
    buildings?: { name: string | null } | null;
  } | null;
}

export function BulkAddChambersDialog({
  lockboxId,
  lockboxName,
  existingSlotCount,
  open,
  onOpenChange,
  onSuccess,
}: BulkAddChambersDialogProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [defaultQty, setDefaultQty] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const { data: chambers, isLoading: roomsLoading } = useQuery({
    queryKey: ["chamber-rooms-for-bulk"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, room_number, name, floor_id, floors(name, buildings(name))")
        .eq("room_type", "chamber")
        .order("room_number", { ascending: true });
      if (error) throw error;
      return (data as unknown as ChamberRoom[]) || [];
    },
    enabled: open,
  });

  const { data: existingSlots } = useQuery({
    queryKey: ["lockbox-slots-room-ids", lockboxId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lockbox_slots")
        .select("room_id")
        .eq("lockbox_id", lockboxId);
      if (error) throw error;
      return new Set((data || []).map((s) => s.room_id).filter(Boolean) as string[]);
    },
    enabled: open && !!lockboxId,
  });

  // Default-select all not-already-added chambers when data loads
  useEffect(() => {
    if (!open || !chambers) return;
    const next: Record<string, boolean> = {};
    const qty: Record<string, number> = {};
    for (const r of chambers) {
      const already = existingSlots?.has(r.id);
      next[r.id] = !already;
      qty[r.id] = defaultQty;
    }
    setSelected(next);
    setQuantities(qty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, chambers, existingSlots]);

  const filtered = useMemo(() => {
    if (!chambers) return [];
    const q = search.trim().toLowerCase();
    if (!q) return chambers;
    return chambers.filter(
      (r) =>
        r.room_number.toLowerCase().includes(q) ||
        (r.name || "").toLowerCase().includes(q),
    );
  }, [chambers, search]);

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected],
  );

  const applyDefaultToAll = () => {
    setQuantities((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) next[id] = defaultQty;
      return next;
    });
  };

  const setAll = (value: boolean) => {
    setSelected((prev) => {
      const next: Record<string, boolean> = {};
      for (const r of chambers || []) {
        const already = existingSlots?.has(r.id);
        next[r.id] = already ? false : value;
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!chambers) return;
    const toCreate = chambers.filter((r) => selected[r.id] && !existingSlots?.has(r.id));
    if (toCreate.length === 0) {
      toast.error("Select at least one chamber to add");
      return;
    }

    setIsSaving(true);
    try {
      const rows = toCreate.map((r, i) => ({
        lockbox_id: lockboxId,
        slot_number: existingSlotCount + i + 1,
        label: `Chambers ${r.room_number} — Main Door`,
        room_id: r.id,
        room_number: r.room_number,
        quantity: Math.max(1, quantities[r.id] || 1),
        status: "in_box" as const,
        key_role: "main_door" as const,
      }));

      const { data: inserted, error } = await supabase
        .from("lockbox_slots")
        .insert(rows)
        .select("id, label, quantity");

      if (error) throw error;

      if (inserted && inserted.length > 0) {
        const logs = inserted.map((s) => ({
          slot_id: s.id,
          action: "status_change" as const,
          status_after: "in_box",
          note: `Bulk-added chambers key "${s.label}" (qty ${s.quantity})`,
        }));
        const { error: logErr } = await supabase
          .from("lockbox_activity_logs")
          .insert(logs);
        if (logErr) logger.error("Failed to log bulk-add activity", logErr);
      }

      toast.success(`Added ${toCreate.length} chambers to ${lockboxName || "lockbox"}`);
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      logger.error("Bulk add chambers failed", err);
      toast.error(getErrorMessage(err) || "Failed to add chambers");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalFrame
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Bulk Add Chambers
        </span>
      }
      description={lockboxName ? `Adding to ${lockboxName}` : undefined}
    >
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search by room number or judge name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs whitespace-nowrap">Default qty</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={defaultQty}
              onChange={(e) => setDefaultQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 h-9"
              disabled={isSaving}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyDefaultToAll}
              disabled={isSaving}
            >
              Apply to all
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            {selectedCount} of {chambers?.length || 0} selected
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAll(true)} disabled={isSaving}>
              Select all
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAll(false)} disabled={isSaving}>
              Clear
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[50vh] border rounded-md">
          {roomsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No chambers found
            </div>
          ) : (
            <ul className="divide-y">
              {filtered.map((r) => {
                const already = existingSlots?.has(r.id) || false;
                const isChecked = !!selected[r.id];
                const building = r.floors?.buildings?.name;
                const floor = r.floors?.name;
                return (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={isChecked}
                      disabled={already || isSaving}
                      onCheckedChange={(v) =>
                        setSelected((p) => ({ ...p, [r.id]: !!v }))
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">
                          Chambers {r.room_number}
                        </span>
                        {r.name && (
                          <span className="text-sm text-muted-foreground truncate">
                            · {r.name}
                          </span>
                        )}
                        {already && (
                          <Badge variant="secondary" className="text-[10px]">
                            Already added
                          </Badge>
                        )}
                      </div>
                      {(building || floor) && (
                        <div className="text-xs text-muted-foreground truncate">
                          {[building, floor].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Label className="text-xs text-muted-foreground">Keys</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={quantities[r.id] ?? 1}
                        onChange={(e) =>
                          setQuantities((p) => ({
                            ...p,
                            [r.id]: Math.max(1, parseInt(e.target.value) || 1),
                          }))
                        }
                        className="w-16 h-8"
                        disabled={already || !isChecked || isSaving}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || selectedCount === 0}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add {selectedCount > 0 ? selectedCount : ""} {selectedCount === 1 ? "Slot" : "Slots"}
          </Button>
        </div>
      </div>
    </ModalFrame>
  );
}

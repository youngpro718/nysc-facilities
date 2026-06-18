import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Package } from "lucide-react";
import { LockboxSlot, getRoomLinkStatus, getKeyRoleLabel } from "../types/LockboxTypes";
import { LockboxSlotCard } from "./LockboxSlotCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AllSlotEntry extends LockboxSlot {
  lockbox?: { id: string; name: string } | null;
}

interface LockboxSearchProps {
  slots: LockboxSlot[];
  allSlots?: AllSlotEntry[];
  onSlotClick: (slot: LockboxSlot) => void;
  lockboxName?: string;
  selectedLockboxId?: string | null;
}

// A slot "needs attention" when it's checked out, missing, or unlinked from
// its room. This is the single useful triage filter — one button covers the
// three operational exceptions instead of three separate toggles.
const slotNeedsAttention = (slot: LockboxSlot): boolean => {
  if (slot.status === 'checked_out' || slot.status === 'missing') return true;
  if (getRoomLinkStatus(slot) === 'unlinked') return true;
  return false;
};

// Subtle table-style column headers — small caps, muted, no tracking-wider.
// Layout columns mirror LockboxSlotCard's grid so the rows line up under them.
function ColumnHeaders() {
  return (
    <div
      className="hidden sm:grid grid-cols-[3rem_minmax(0,1.6fr)_minmax(0,1fr)_auto_auto] gap-3 sm:gap-4 px-3 sm:px-4 py-2 border-b border-border bg-muted/20 text-[10px] font-medium text-muted-foreground"
      aria-hidden="true"
    >
      <div>SLOT</div>
      <div>KEY</div>
      <div>LOCATION / HOLDER</div>
      <div>STATUS</div>
      <div className="w-[3.25rem]" />
    </div>
  );
}

export function LockboxSearch({ slots, allSlots, onSlotClick, lockboxName, selectedLockboxId }: LockboxSearchProps) {
  const [query, setQuery] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(false);

  const isSearching = query.trim().length > 0;

  const attentionCount = slots.filter(slotNeedsAttention).length;

  // Browse view — apply the needs-attention filter when active
  const filteredLocalSlots = attentionOnly ? slots.filter(slotNeedsAttention) : slots;

  // Global search view — searches across ALL lockboxes
  const globalMatches = useMemo(() => {
    if (!isSearching) return [];
    const searchStr = query.toLowerCase();
    const source = allSlots && allSlots.length > 0 ? allSlots : (slots as AllSlotEntry[]);
    return source.filter(slot => {
      const roleLabel = getKeyRoleLabel(slot.key_role, slot.sub_room_label)?.toLowerCase();
      return (
        slot.label?.toLowerCase().includes(searchStr) ||
        String(slot.slot_number).includes(searchStr) ||
        slot.room_number?.toLowerCase().includes(searchStr) ||
        slot.room?.name?.toLowerCase().includes(searchStr) ||
        slot.room?.room_number?.toLowerCase().includes(searchStr) ||
        slot.lockbox?.name?.toLowerCase().includes(searchStr) ||
        slot.sub_room_label?.toLowerCase().includes(searchStr) ||
        roleLabel?.includes(searchStr)
      );
    });
  }, [isSearching, query, allSlots, slots]);

  // Group global matches by lockbox
  const groupedMatches = useMemo(() => {
    const map = new Map<string, { name: string; id: string; items: AllSlotEntry[] }>();
    for (const slot of globalMatches) {
      const id = slot.lockbox?.id || slot.lockbox_id || 'unknown';
      const name = slot.lockbox?.name || lockboxName || 'Lockbox';
      const group = map.get(id) || { id, name, items: [] };
      group.items.push(slot);
      map.set(id, group);
    }
    // Put the currently selected lockbox first for familiarity
    return Array.from(map.values()).sort((a, b) => {
      if (a.id === selectedLockboxId) return -1;
      if (b.id === selectedLockboxId) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [globalMatches, lockboxName, selectedLockboxId]);

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Search row — full-width input + a single "Needs attention" toggle.
          One button covers the three operational exceptions (checked out,
          missing, unlinked); pile of toggle pills replaced. */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search all lockboxes"
            className="pl-9 h-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {!isSearching && (
          <Button
            type="button"
            variant={attentionOnly ? 'default' : 'outline'}
            size="sm"
            className="h-10 shrink-0"
            onClick={() => setAttentionOnly(v => !v)}
          >
            Needs attention
            {attentionCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 px-1.5 tabular bg-transparent border border-current/30"
              >
                {attentionCount}
              </Badge>
            )}
          </Button>
        )}
      </div>

      {isSearching && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
          <Package className="h-4 w-4" />
          <span>
            Showing {globalMatches.length} {globalMatches.length === 1 ? 'match' : 'matches'} from all lockboxes
          </span>
        </div>
      )}

      <ScrollArea className="flex-1 pr-4">
        {isSearching ? (
          groupedMatches.length > 0 ? (
            <div className="space-y-5">
              {groupedMatches.map(group => (
                <div key={group.id} className="rounded-md border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/30">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium text-sm">
                      {group.name}
                      {group.id === selectedLockboxId && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">(current)</span>
                      )}
                    </h3>
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {group.items.length}
                    </Badge>
                  </div>
                  <ColumnHeaders />
                  <div>
                    {group.items.map(slot => (
                      <LockboxSlotCard
                        key={slot.id}
                        slot={slot}
                        onClick={onSlotClick}
                        lockboxName={group.id === selectedLockboxId ? undefined : group.name}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No keys found matching "{query}" in any lockbox.
            </div>
          )
        ) : (
          <div className="rounded-md border border-border bg-card overflow-hidden">
            {filteredLocalSlots.length > 0 ? (
              <>
                <ColumnHeaders />
                <div>
                  {filteredLocalSlots.map(slot => (
                    <LockboxSlotCard
                      key={slot.id}
                      slot={slot}
                      onClick={onSlotClick}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-sm text-muted-foreground">
                {attentionOnly ? (
                  <>
                    No slots currently need attention.
                    <button
                      className="block mx-auto mt-2 text-primary underline text-xs"
                      onClick={() => setAttentionOnly(false)}
                    >
                      Show all slots
                    </button>
                  </>
                ) : (
                  <>No keys in {lockboxName || 'this lockbox'} yet.</>
                )}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Link2Off, CircleDashed, Package } from "lucide-react";
import { LockboxSlot, getRoomLinkStatus, getKeyRoleLabel } from "../types/LockboxTypes";
import { LockboxSlotCard } from "./LockboxSlotCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toggle } from "@/components/ui/toggle";
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

type RoomFilter = 'all' | 'unlinked' | 'no_room';

export function LockboxSearch({ slots, allSlots, onSlotClick, lockboxName, selectedLockboxId }: LockboxSearchProps) {
  const [query, setQuery] = useState("");
  const [roomFilter, setRoomFilter] = useState<RoomFilter>('all');

  const isSearching = query.trim().length > 0;

  // Count slots by room link status (scoped to current lockbox; filters are a management tool)
  const unlinkedCount = slots.filter(slot => getRoomLinkStatus(slot) === 'unlinked').length;
  const noRoomCount = slots.filter(slot => getRoomLinkStatus(slot) === 'no_room').length;

  // Browse view — filtered slots from the currently selected lockbox
  const filteredLocalSlots = slots.filter(slot => {
    if (roomFilter === 'all') return true;
    const linkStatus = getRoomLinkStatus(slot);
    if (roomFilter === 'unlinked') return linkStatus === 'unlinked';
    if (roomFilter === 'no_room') return linkStatus === 'no_room';
    return true;
  });

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
    <div className="flex flex-col h-full space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search every lockbox by key, room, or slot..."
            className="pl-9 h-10 text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      {/* Filters only apply to the browse view, not the global search */}
      {!isSearching && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filter:</span>

          <Toggle
            pressed={roomFilter === 'all'}
            onPressedChange={() => setRoomFilter('all')}
            size="sm"
            variant="outline"
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            All
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
              {slots.length}
            </Badge>
          </Toggle>

          {unlinkedCount > 0 && (
            <Toggle
              pressed={roomFilter === 'unlinked'}
              onPressedChange={() => setRoomFilter(roomFilter === 'unlinked' ? 'all' : 'unlinked')}
              size="sm"
              variant="outline"
              className="data-[state=on]:bg-yellow-500 data-[state=on]:text-white touch-manipulation"
            >
              <Link2Off className="h-3.5 w-3.5 mr-1" />
              Unlinked
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                {unlinkedCount}
              </Badge>
            </Toggle>
          )}

          {noRoomCount > 0 && (
            <Toggle
              pressed={roomFilter === 'no_room'}
              onPressedChange={() => setRoomFilter(roomFilter === 'no_room' ? 'all' : 'no_room')}
              size="sm"
              variant="outline"
              className="data-[state=on]:bg-muted-foreground data-[state=on]:text-white touch-manipulation"
            >
              <CircleDashed className="h-3.5 w-3.5 mr-1" />
              No Room
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                {noRoomCount}
              </Badge>
            </Toggle>
          )}
        </div>
      )}

      {isSearching && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                <div key={group.id} className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">
                      {group.name}
                      {group.id === selectedLockboxId && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">(current)</span>
                      )}
                    </h3>
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {group.items.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
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
            <div className="text-center py-12 text-muted-foreground">
              No keys found matching "{query}" in any lockbox
            </div>
          )
        ) : (
          <div className="space-y-2">
            {filteredLocalSlots.length > 0 ? (
              filteredLocalSlots.map(slot => (
                <LockboxSlotCard
                  key={slot.id}
                  slot={slot}
                  onClick={onSlotClick}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {roomFilter !== 'all' ? (
                  <>
                    No slots match the current filter
                    <button
                      className="block mx-auto mt-2 text-primary underline text-sm"
                      onClick={() => setRoomFilter('all')}
                    >
                      Clear filter
                    </button>
                  </>
                ) : (
                  <>No keys in {lockboxName || 'this lockbox'} yet</>
                )}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

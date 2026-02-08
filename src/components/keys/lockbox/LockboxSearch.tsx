import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Filter, Link2Off, CircleDashed } from "lucide-react";
import { LockboxSlot, getRoomLinkStatus } from "../types/LockboxTypes";
import { LockboxSlotCard } from "./LockboxSlotCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LockboxSearchProps {
  slots: LockboxSlot[];
  onSlotClick: (slot: LockboxSlot) => void;
  lockboxName?: string;
}

type RoomFilter = 'all' | 'unlinked' | 'no_room';

export function LockboxSearch({ slots, onSlotClick, lockboxName }: LockboxSearchProps) {
  const [query, setQuery] = useState("");
  const [roomFilter, setRoomFilter] = useState<RoomFilter>('all');

  // Count slots by room link status
  const unlinkedCount = slots.filter(slot => getRoomLinkStatus(slot) === 'unlinked').length;
  const noRoomCount = slots.filter(slot => getRoomLinkStatus(slot) === 'no_room').length;

  const filteredSlots = slots.filter(slot => {
    // Text search
    const searchStr = query.toLowerCase();
    const matchesSearch = 
      slot.label.toLowerCase().includes(searchStr) ||
      String(slot.slot_number).includes(searchStr) ||
      slot.room_number?.toLowerCase().includes(searchStr);

    if (!matchesSearch) return false;

    // Room filter
    if (roomFilter === 'all') return true;
    
    const linkStatus = getRoomLinkStatus(slot);
    if (roomFilter === 'unlinked') return linkStatus === 'unlinked';
    if (roomFilter === 'no_room') return linkStatus === 'no_room';
    
    return true;
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by key name, room number, or slot..."
            className="pl-9 h-10 text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      {/* Room Link Filters */}
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={roomFilter === 'unlinked'}
                  onPressedChange={() => setRoomFilter(roomFilter === 'unlinked' ? 'all' : 'unlinked')}
                  size="sm"
                  variant="outline"
                  className="data-[state=on]:bg-yellow-500 data-[state=on]:text-white"
                >
                  <Link2Off className="h-3.5 w-3.5 mr-1" />
                  Unlinked
                  <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    {unlinkedCount}
                  </Badge>
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                <p>Slots with room number but not linked to database room</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {noRoomCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={roomFilter === 'no_room'}
                  onPressedChange={() => setRoomFilter(roomFilter === 'no_room' ? 'all' : 'no_room')}
                  size="sm"
                  variant="outline"
                  className="data-[state=on]:bg-muted-foreground data-[state=on]:text-white"
                >
                  <CircleDashed className="h-3.5 w-3.5 mr-1" />
                  No Room
                  <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                    {noRoomCount}
                  </Badge>
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                <p>Slots with no room assigned</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-2">
          {filteredSlots.length > 0 ? (
            filteredSlots.map(slot => (
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
                <>No keys found matching "{query}"</>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

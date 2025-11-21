import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { LockboxSlot } from "../types/LockboxTypes";
import { LockboxSlotCard } from "./LockboxSlotCard";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LockboxSearchProps {
  slots: LockboxSlot[];
  onSlotClick: (slot: LockboxSlot) => void;
  lockboxName?: string;
}

export function LockboxSearch({ slots, onSlotClick, lockboxName }: LockboxSearchProps) {
  const [query, setQuery] = useState("");

  const filteredSlots = slots.filter(slot => {
    const searchStr = query.toLowerCase();
    return (
      slot.label.toLowerCase().includes(searchStr) ||
      String(slot.slot_number).includes(searchStr) ||
      slot.room_number?.toLowerCase().includes(searchStr)
    );
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by key name, room number, or slot..."
          className="pl-9 h-10 text-lg"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
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
              No keys found matching "{query}"
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

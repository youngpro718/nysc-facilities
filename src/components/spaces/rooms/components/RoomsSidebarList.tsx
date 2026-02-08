import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Room } from "../types/RoomTypes";
import { Badge } from "@/components/ui/badge";

interface RoomsSidebarListProps {
  rooms: Room[];
  selectedRoomId?: string | null;
  onSelect: (room: Room) => void;
  isLoading?: boolean;
}

export function RoomsSidebarList({ rooms, selectedRoomId, onSelect, isLoading }: RoomsSidebarListProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b bg-muted/30 rounded-t-md flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">Rooms</p>
        {rooms.length > 0 && (
          <Badge variant="secondary" className="text-xs">{rooms.length}</Badge>
        )}
      </div>
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 rounded-md" />
            ))}
          </div>
        ) : (
          <ul className="divide-y">
            {rooms.map((room) => {
              const isActive = room.id === selectedRoomId;
              return (
                <li key={room.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(room)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 hover:bg-accent/60 transition-colors",
                      isActive && "bg-accent/50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="truncate font-medium">{room.room_number || room.name}</div>
                          <span className="shrink-0 whitespace-nowrap text-xs rounded border px-1.5 py-0.5 leading-tight text-muted-foreground capitalize">
                            {room.room_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {room.room_number && room.name !== room.room_number && (
                          <div className="truncate text-xs text-muted-foreground mt-0.5">{room.name}</div>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}

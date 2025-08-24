import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Room } from "../types/RoomTypes";

interface RoomsSidebarListProps {
  rooms: Room[];
  selectedRoomId?: string | null;
  onSelect: (room: Room) => void;
}

export function RoomsSidebarList({ rooms, selectedRoomId, onSelect }: RoomsSidebarListProps) {
  return (
    <div className="h-full">
      <div className="px-3 py-2 border-b bg-muted/30 rounded-t-md">
        <p className="text-sm font-medium text-muted-foreground">Rooms</p>
      </div>
      <ScrollArea className="h-[calc(100vh-220px)]">
        <ul className="divide-y">
          {rooms.map((room) => {
            const isActive = room.id === selectedRoomId;
            return (
              <li key={room.id}>
                  <button
                  type="button"
                  onClick={() => onSelect(room)}
                  className={cn(
                    "w-full text-left px-3 py-1.5 hover:bg-accent/60 transition-colors",
                    isActive && "bg-accent/50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate font-medium">{room.room_number || room.name}</div>
                        <span className="shrink-0 whitespace-nowrap text-[10px] rounded border px-1.5 py-0.5 leading-tight text-muted-foreground">
                          {room.room_type}
                        </span>
                      </div>
                      {room.room_number && room.name !== room.room_number && (
                        <div className="truncate text-xs text-muted-foreground">{room.name}</div>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
}

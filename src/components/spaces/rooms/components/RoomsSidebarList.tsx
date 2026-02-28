import React, { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Room } from "../types/RoomTypes";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronDown } from "lucide-react";

interface RoomsSidebarListProps {
  rooms: Room[];
  selectedRoomId?: string | null;
  onSelect: (room: Room) => void;
  isLoading?: boolean;
}

export function RoomsSidebarList({ rooms, selectedRoomId, onSelect, isLoading }: RoomsSidebarListProps) {
  // Group rooms by building name
  const groupedRooms = useMemo(() => {
    const groups = new Map<string, Room[]>();
    for (const room of rooms) {
      const buildingName = room.floor?.building?.name || 'Unknown Building';
      const list = groups.get(buildingName) || [];
      list.push(room);
      groups.set(buildingName, list);
    }
    // Sort building names alphabetically
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [rooms]);

  // All buildings expanded by default
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleBuilding = (name: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

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
        ) : groupedRooms.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No rooms found</div>
        ) : (
          <div>
            {groupedRooms.map(([buildingName, buildingRooms]) => {
              const isCollapsed = collapsed.has(buildingName);
              return (
                <div key={buildingName}>
                  {/* Building header */}
                  <button
                    type="button"
                    onClick={() => toggleBuilding(buildingName)}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 bg-muted/40 hover:bg-muted/60 transition-colors border-b sticky top-0 z-10"
                  >
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs font-semibold text-muted-foreground truncate flex-1">
                      {buildingName}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 shrink-0">
                      {buildingRooms.length}
                    </Badge>
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                      isCollapsed && "-rotate-90"
                    )} />
                  </button>

                  {/* Room list */}
                  {!isCollapsed && (
                    <ul className="divide-y">
                      {buildingRooms.map((room) => {
                        const isActive = room.id === selectedRoomId;
                        const issueCount = Array.isArray(room.issues) ? room.issues.length : 0;
                        const statusDotColor =
                          room.status === 'active' && issueCount === 0
                            ? 'bg-status-operational'
                            : issueCount > 0
                            ? 'bg-status-warning'
                            : 'bg-status-neutral';
                        const floorLabel = room.floor?.name
                          ? `FL ${room.floor.name.replace(/[^0-9]/g, '') || room.floor.name}`
                          : null;

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
                              <div className="flex items-center gap-2">
                                {/* Status dot */}
                                <span className={cn("h-2 w-2 rounded-full shrink-0", statusDotColor)} />

                                <div className="min-w-0 flex-1 flex items-center gap-2">
                                  <span className="truncate font-medium text-sm">
                                    {room.room_number || room.name}
                                  </span>
                                  <span className="shrink-0 whitespace-nowrap text-[11px] rounded border px-1.5 py-0.5 leading-tight text-muted-foreground capitalize">
                                    {room.room_type.replace(/_/g, ' ')}
                                  </span>
                                </div>

                                {/* Floor badge */}
                                {floorLabel && (
                                  <span className="shrink-0 text-[11px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                                    {floorLabel}
                                  </span>
                                )}
                              </div>
                              {room.room_number && room.name !== room.room_number && (
                                <div className="truncate text-xs text-muted-foreground mt-0.5 pl-4">{room.name}</div>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

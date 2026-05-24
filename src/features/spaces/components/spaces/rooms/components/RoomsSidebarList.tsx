import React, { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Room } from "../types/RoomTypes";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronDown, ImageIcon } from "lucide-react";
import type { RoomCourtAssignment } from "@features/spaces/hooks/queries/useCourtAssignmentsMap";

interface RoomsSidebarListProps {
  rooms: Room[];
  selectedRoomId?: string | null;
  onSelect: (room: Room) => void;
  isLoading?: boolean;
  assignmentsByRoomId?: Map<string, RoomCourtAssignment>;
}

export function RoomsSidebarList({
  rooms,
  selectedRoomId,
  onSelect,
  isLoading,
  assignmentsByRoomId,
}: RoomsSidebarListProps) {
  const groupedRooms = useMemo(() => {
    const groups = new Map<string, Room[]>();
    for (const room of rooms) {
      const buildingName = room.floor?.building?.name || "Unknown Building";
      const list = groups.get(buildingName) || [];
      list.push(room);
      groups.set(buildingName, list);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [rooms]);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleBuilding = (name: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="px-3 py-2 border-b bg-muted/30 rounded-t-md flex items-center justify-between shrink-0">
        <p className="text-sm font-medium text-muted-foreground">Rooms</p>
        {rooms.length > 0 && (
          <Badge variant="secondary" className="text-xs">{rooms.length}</Badge>
        )}
      </div>
      <ScrollArea className="flex-1 min-h-0">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-14 rounded-md" />
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
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                        isCollapsed && "-rotate-90"
                      )}
                    />
                  </button>

                  {!isCollapsed && (
                    <ul className="divide-y">
                      {buildingRooms.map((room) => {
                        const isActive = room.id === selectedRoomId;
                        const issueCount = Array.isArray(room.issues)
                          ? room.issues.filter(
                              (i: any) => i.status === "open" || i.status === "in_progress"
                            ).length
                          : 0;
                        const statusDotColor =
                          room.status === "active" && issueCount === 0
                            ? "bg-status-operational"
                            : issueCount > 0
                            ? "bg-status-warning"
                            : "bg-status-neutral";

                        // Thumbnail: prefer judge_view, fall back to audience_view
                        const photos = room.courtroom_photos;
                        const thumb =
                          (Array.isArray(photos?.judge_view) && photos?.judge_view?.[0]) ||
                          (Array.isArray(photos?.audience_view) && photos?.audience_view?.[0]) ||
                          null;

                        const assignment = assignmentsByRoomId?.get(room.id);
                        const secondary =
                          room.room_type === "courtroom" && assignment
                            ? [
                                assignment.part ? `Part ${assignment.part}` : null,
                                assignment.justice || null,
                              ]
                                .filter(Boolean)
                                .join(" • ")
                            : room.name && room.name !== room.room_number
                            ? room.name
                            : room.room_type.replace(/_/g, " ");

                        return (
                          <li key={room.id}>
                            <button
                              type="button"
                              onClick={() => onSelect(room)}
                              className={cn(
                                "w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-accent/60 transition-colors",
                                isActive && "bg-accent/60"
                              )}
                            >
                              {/* Thumbnail */}
                              <div className="relative h-10 w-10 shrink-0 rounded-md overflow-hidden bg-muted border">
                                {thumb ? (
                                  <img
                                    src={thumb as string}
                                    alt=""
                                    loading="lazy"
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                    <ImageIcon className="h-4 w-4 opacity-50" />
                                  </div>
                                )}
                                <span
                                  className={cn(
                                    "absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background",
                                    statusDotColor
                                  )}
                                />
                              </div>

                              {/* Two-line text */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="truncate font-medium text-sm text-foreground">
                                    {room.room_number || room.name}
                                  </span>
                                  {issueCount > 0 && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] px-1.5 py-0 h-4 shrink-0 border-status-warning text-status-warning"
                                    >
                                      {issueCount}
                                    </Badge>
                                  )}
                                </div>
                                <div className="truncate text-xs text-muted-foreground mt-0.5 capitalize">
                                  {secondary}
                                </div>
                              </div>
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

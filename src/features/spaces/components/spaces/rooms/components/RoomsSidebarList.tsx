import React, { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Room } from "../types/RoomTypes";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronDown, DropletIcon, ImageIcon } from "lucide-react";
import type { RoomCourtAssignment } from "@features/spaces/hooks/queries/useCourtAssignmentsMap";
import type { CommonArea } from "../../common-areas/types";
import { commonAreaTypeLabel } from "../../common-areas/types";
import { mergeRoomsAndCommonAreas, type RoomListEntry } from "../utils/roomListEntries";

interface RoomsSidebarListProps {
  rooms: Room[];
  selectedRoomId?: string | null;
  onSelect: (room: Room) => void;
  isLoading?: boolean;
  assignmentsByRoomId?: Map<string, RoomCourtAssignment>;
  // Common areas (hallways, lobbies, …) shown inline among the rooms —
  // e.g. cooler-equipped areas when the water-cooler filter is active.
  // They render in orange so they read as "not a room".
  commonAreas?: CommonArea[];
  selectedCommonAreaId?: string | null;
  onSelectCommonArea?: (area: CommonArea) => void;
}

export function RoomsSidebarList({
  rooms,
  selectedRoomId,
  onSelect,
  isLoading,
  assignmentsByRoomId,
  commonAreas,
  selectedCommonAreaId,
  onSelectCommonArea,
}: RoomsSidebarListProps) {
  const totalCount = rooms.length + (commonAreas?.length ?? 0);

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, { rooms: Room[]; areas: CommonArea[] }>();
    const groupFor = (buildingName: string) => {
      const existing = groups.get(buildingName);
      if (existing) return existing;
      const created = { rooms: [] as Room[], areas: [] as CommonArea[] };
      groups.set(buildingName, created);
      return created;
    };
    for (const room of rooms) {
      groupFor(room.floor?.building?.name || "Unknown Building").rooms.push(room);
    }
    for (const area of commonAreas ?? []) {
      groupFor(area.floor?.building?.name || "Unknown Building").areas.push(area);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([buildingName, group]): [string, RoomListEntry[]] => [
        buildingName,
        mergeRoomsAndCommonAreas(group.rooms, group.areas),
      ]);
  }, [rooms, commonAreas]);

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
        {totalCount > 0 && (
          <Badge variant="secondary" className="text-xs">{totalCount}</Badge>
        )}
      </div>
      <ScrollArea className="flex-1 min-h-0">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-14 rounded-md" />
            ))}
          </div>
        ) : groupedEntries.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No rooms found</div>
        ) : (
          <div>
            {groupedEntries.map(([buildingName, entries]) => {
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
                      {entries.length}
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
                      {entries.map((entry) =>
                        entry.kind === "common_area" ? (
                          <CommonAreaRow
                            key={`area-${entry.area.id}`}
                            area={entry.area}
                            isActive={entry.area.id === selectedCommonAreaId}
                            onSelect={onSelectCommonArea}
                          />
                        ) : (
                          <RoomRow
                            key={entry.room.id}
                            room={entry.room}
                            isActive={entry.room.id === selectedRoomId}
                            assignment={assignmentsByRoomId?.get(entry.room.id)}
                            onSelect={onSelect}
                          />
                        )
                      )}
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

function CommonAreaRow({
  area,
  isActive,
  onSelect,
}: {
  area: CommonArea;
  isActive: boolean;
  onSelect?: (area: CommonArea) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect?.(area)}
        className={cn(
          "w-full text-left px-3 py-2 flex items-center gap-3 transition-colors",
          "border-l-2 border-l-orange-500 bg-orange-50/70 hover:bg-orange-100/80",
          "dark:bg-orange-950/20 dark:hover:bg-orange-950/40",
          isActive && "bg-orange-100 dark:bg-orange-950/50"
        )}
      >
        <div className="h-10 w-10 shrink-0 rounded-md border border-orange-300 bg-orange-100 dark:border-orange-800 dark:bg-orange-950/50 flex items-center justify-center text-orange-600 dark:text-orange-400">
          <DropletIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-sm text-foreground">{area.name}</span>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 shrink-0 border-orange-500 text-orange-700 dark:text-orange-400"
            >
              Common Area
            </Badge>
          </div>
          <div className="truncate text-xs text-muted-foreground mt-0.5">
            {commonAreaTypeLabel(area.area_type)} • {area.floor?.name}
            {area.water_cooler_count > 0 &&
              ` • ${area.water_cooler_count} ${area.water_cooler_count === 1 ? "cooler" : "coolers"}`}
          </div>
        </div>
      </button>
    </li>
  );
}

function RoomRow({
  room,
  isActive,
  assignment,
  onSelect,
}: {
  room: Room;
  isActive: boolean;
  assignment?: RoomCourtAssignment;
  onSelect: (room: Room) => void;
}) {
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

  // Build "Part 30 • Justice Smith" for courtrooms, or
  // "<name or type> • <floor>" for everything else so the
  // floor is visible without clicking into the room.
  const baseSecondary =
    room.name && room.name !== room.room_number
      ? room.name
      : room.room_type.replace(/_/g, " ");
  const secondary =
    room.room_type === "courtroom" && assignment
      ? [
          assignment.part ? `Part ${assignment.part}` : null,
          assignment.justice || null,
        ]
          .filter(Boolean)
          .join(" • ")
      : [baseSecondary, room.floor?.name]
          .filter(Boolean)
          .join(" • ");

  return (
    <li>
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
              alt={`Room ${room.room_number || room.name}`}
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
}

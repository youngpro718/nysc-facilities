import React from 'react';
import { DropletIcon, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Room } from "../types/RoomTypes";
import { RoomCard } from "../RoomCard";
import { RoomTable } from "../RoomTable";
import { MobileRoomCard } from "./MobileRoomCard";
import { useIsMobile } from "@shared/hooks/use-mobile";
import { commonAreaTypeLabel, type CommonArea } from "../../common-areas/types";
import { mergeRoomsAndCommonAreas } from "../utils/roomListEntries";

export interface RoomsContentProps {
  isLoading: boolean;
  rooms: Room[];
  filteredRooms: Room[];
  // Common areas shown inline among the rooms (orange), e.g. cooler-equipped
  // hallways when the water-cooler filter is active.
  commonAreas?: CommonArea[];
  view: "grid" | "list" | "master-detail";
  onDelete?: (id: string) => void;
  searchQuery?: string;
  onRoomClick?: (room: Room) => void;
}

/** Compact read-only card for a common area in the mobile/grid room list. */
function CommonAreaListCard({ area }: { area: CommonArea }) {
  return (
    <div className="rounded-lg border border-l-4 border-l-orange-500 border-orange-300/70 bg-orange-50/70 p-3 dark:border-orange-800/70 dark:border-l-orange-500 dark:bg-orange-950/20">
      <div className="flex items-center gap-2">
        <DropletIcon className="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" />
        <span className="font-medium text-sm truncate">{area.name}</span>
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 h-4 shrink-0 border-orange-500 text-orange-700 dark:text-orange-400"
        >
          Common Area
        </Badge>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {commonAreaTypeLabel(area.area_type)} • {area.floor?.building?.name} · {area.floor?.name}
        {area.water_cooler_count > 0 &&
          ` • ${area.water_cooler_count} ${area.water_cooler_count === 1 ? "cooler" : "coolers"}`}
      </div>
      {area.water_cooler_notes && (
        <div className="mt-1 text-xs text-muted-foreground">Cooler placement: {area.water_cooler_notes}</div>
      )}
    </div>
  );
}

export function RoomsContent({
  isLoading,
  rooms,
  filteredRooms,
  commonAreas,
  view,
  onDelete,
  searchQuery,
  onRoomClick,
}: RoomsContentProps) {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {isMobile ? (
          <div className="space-y-3 px-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[100px] rounded-md" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[300px]" />
            ))}
          </div>
        )}
      </div>
    );
  }

  const areas = commonAreas ?? [];

  if (filteredRooms.length === 0 && areas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-base font-medium text-muted-foreground">
          {searchQuery ? `No rooms found for "${searchQuery}"` : 'No rooms found'}
        </p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          {searchQuery ? 'Try adjusting your search or filters' : 'No rooms match your current filters'}
        </p>
      </div>
    );
  }

  const entries = mergeRoomsAndCommonAreas(filteredRooms, areas);

  // Mobile: Use optimized MobileRoomCard in a vertical list
  if (isMobile && view === 'grid') {
    return (
      <div className="space-y-3 px-1">
        {entries.map((entry) =>
          entry.kind === "common_area" ? (
            <CommonAreaListCard key={`area-${entry.area.id}`} area={entry.area} />
          ) : (
            <MobileRoomCard
              key={entry.room.id}
              room={entry.room}
              onDelete={onDelete}
              onRoomClick={onRoomClick}
            />
          )
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {view === 'grid' ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {entries.map((entry) =>
            entry.kind === "common_area" ? (
              <CommonAreaListCard key={`area-${entry.area.id}`} area={entry.area} />
            ) : (
              <RoomCard
                key={entry.room.id}
                room={entry.room}
                onDelete={onDelete}
                onRoomClick={onRoomClick}
              />
            )
          )}
        </div>
      ) : (
        <RoomTable
          rooms={filteredRooms}
          onDelete={onDelete}
          onRoomClick={onRoomClick}
        />
      )}
    </div>
  );
}

import React from 'react';
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Room } from "../types/RoomTypes";
import { RoomCard } from "../RoomCard";
import { RoomTable } from "../RoomTable";
import { MobileRoomCard } from "./MobileRoomCard";
import { useIsMobile } from "@/hooks/use-mobile";

export interface RoomsContentProps {
  isLoading: boolean;
  rooms: Room[];
  filteredRooms: Room[];
  view: "grid" | "list" | "master-detail";
  onDelete: (id: string) => void;
  searchQuery?: string;
  onRoomClick?: (room: Room) => void;
}

export function RoomsContent({
  isLoading,
  rooms,
  filteredRooms,
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
              <Skeleton key={i} className="h-[100px] rounded-xl" />
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

  if (filteredRooms.length === 0) {
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

  // Mobile: Use optimized MobileRoomCard in a vertical list
  if (isMobile && view === 'grid') {
    return (
      <div className="space-y-3 px-1">
        {filteredRooms.map((room) => (
          <MobileRoomCard
            key={room.id}
            room={room}
            onDelete={onDelete}
            onRoomClick={onRoomClick}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {view === 'grid' ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onDelete={onDelete}
              onRoomClick={onRoomClick}
            />
          ))}
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

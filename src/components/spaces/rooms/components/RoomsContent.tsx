
import React, { useMemo } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Room } from "../types/RoomTypes";
import { RoomCard } from "../RoomCard";
import { RoomTable } from "../RoomTable";
import { SearchResultsInfo } from "./SearchResultsInfo";

export interface RoomsContentProps {
  isLoading: boolean;
  rooms: Room[];
  filteredRooms: Room[];
  view: "grid" | "list";
  onDelete: (id: string) => void;
  searchQuery?: string;
}

export function RoomsContent({
  isLoading,
  rooms,
  filteredRooms,
  view,
  onDelete,
  searchQuery,
}: RoomsContentProps) {
  // Calculate room type counts for the filtered rooms
  const roomTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    filteredRooms.forEach(room => {
      const type = room.room_type;
      counts[type] = (counts[type] || 0) + 1;
    });
    
    return counts;
  }, [filteredRooms]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[300px]" />
          ))}
        </div>
      </div>
    );
  }

  if (filteredRooms.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        {searchQuery ? 
          `No rooms found for "${searchQuery}"` : 
          'No rooms found matching your criteria'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SearchResultsInfo 
        totalCount={rooms.length}
        filteredCount={filteredRooms.length}
        searchQuery={searchQuery}
        roomTypeCounts={roomTypeCounts}
      />

      {view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <RoomTable
          rooms={filteredRooms}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

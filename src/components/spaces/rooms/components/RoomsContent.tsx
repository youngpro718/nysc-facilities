
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Room } from "../types/RoomTypes";
import { RoomCard } from "../RoomCard";
import { RoomTable } from "../RoomTable";

interface RoomsContentProps {
  isLoading: boolean;
  rooms: Room[];
  view: "grid" | "list";
  onDelete: (id: string) => void;
}

export function RoomsContent({
  isLoading,
  rooms,
  view,
  onDelete,
}: RoomsContentProps) {
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

  if (rooms.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No rooms found matching your criteria
      </div>
    );
  }

  if (view === 'grid') {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }

  return (
    <RoomTable
      rooms={rooms}
      onDelete={onDelete}
    />
  );
}

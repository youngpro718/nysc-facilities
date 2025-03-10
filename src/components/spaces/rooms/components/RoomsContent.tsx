
import { Room } from "../types/RoomTypes";
import { RoomCard } from "../RoomCard";
import { RoomTable } from "../RoomTable";
import { Skeleton } from "@/components/ui/skeleton";

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
  searchQuery = "",
}: RoomsContentProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[200px] w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (!filteredRooms.length) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-muted-foreground">
          {searchQuery
            ? `No rooms found matching "${searchQuery}"`
            : "No rooms found in this location"}
        </p>
      </div>
    );
  }

  return view === "grid" ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredRooms.map((room) => (
        <RoomCard key={room.id} room={room} onDelete={onDelete} />
      ))}
    </div>
  ) : (
    <RoomTable rooms={filteredRooms} onDelete={onDelete} />
  );
}

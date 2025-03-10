
import { RoomCard } from "../RoomCard";
import { Room } from "../types/RoomTypes";
import { RoomTable } from "../RoomTable";
import { FlippableRoomCard } from "./FlippableRoomCard";
import { SearchResultsInfo } from "./SearchResultsInfo";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface RoomsContentProps {
  isLoading: boolean;
  rooms: Room[];
  filteredRooms: Room[];
  view: "grid" | "list";
  onDelete: (id: string) => void;
  searchQuery: string;
  cardType?: "standard" | "flippable";
}

export function RoomsContent({
  isLoading,
  rooms,
  filteredRooms,
  view,
  onDelete,
  searchQuery,
  cardType = "standard"
}: RoomsContentProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center p-8 bg-muted/20 rounded-lg">
        <h3 className="text-lg font-medium">No Rooms Found</h3>
        <p className="text-muted-foreground">
          There are no rooms added to the system yet.
        </p>
      </div>
    );
  }

  if (filteredRooms.length === 0) {
    return (
      <div className="text-center p-8 bg-muted/20 rounded-lg">
        <h3 className="text-lg font-medium">No Results</h3>
        <p className="text-muted-foreground">
          No rooms match your search criteria. Try adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SearchResultsInfo 
        totalCount={rooms.length} 
        filteredCount={filteredRooms.length} 
        searchQuery={searchQuery} 
      />

      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => (
            <div key={room.id} className="h-full">
              {cardType === "flippable" ? (
                <FlippableRoomCard room={room} onDelete={onDelete} />
              ) : (
                <RoomCard room={room} onDelete={onDelete} />
              )}
            </div>
          ))}
        </div>
      ) : (
        <RoomTable rooms={filteredRooms} onDelete={onDelete} />
      )}
    </div>
  );
}

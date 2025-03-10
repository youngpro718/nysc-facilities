import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { RoomCard } from "../rooms/RoomCard";
import { Room } from "../rooms/types/RoomTypes";
import { GridView } from "../views/GridView";
import { ListView } from "../views/ListView";
import { CreateSpaceDialog } from "../CreateSpaceDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { TableCell, TableHead } from "@/components/ui/table";
import { useRoomData } from "../hooks/useRoomData";
import { filterSpaces, sortSpaces } from "../utils/spaceFilters";
import { SpaceListFilters } from "../SpaceListFilters";

interface RoomParams {
  buildingId?: string;
  floorId?: string;
}

export function RoomsPage() {
  const params = useParams<RoomParams>();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const { rooms, isLoading, error, deleteRoom } = useRoomData({
    selectedBuilding: params.buildingId || "all",
    selectedFloor: params.floorId || "all"
  });

  const filteredAndSortedRooms = rooms ? 
    sortSpaces(filterSpaces(rooms, searchQuery, statusFilter), sortBy as any) : 
    [];

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      await deleteRoom(id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading rooms...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error.message || "Failed to load rooms"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Rooms</h2>
        <CreateSpaceDialog initialType="room" />
      </div>

      <SpaceListFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        view={view}
        onViewChange={setView}
      />

      {view === 'grid' ? (
        <GridView
          items={filteredAndSortedRooms}
          renderItem={(room) => <RoomCard room={room} onDelete={handleDelete} />}
          emptyMessage="No rooms found"
          onDelete={handleDelete}
          type="room"
        />
      ) : (
        <ListView
          items={filteredAndSortedRooms}
          renderRow={(room) => [
            <TableCell key="name">{room.name}</TableCell>,
            <TableCell key="number">{room.room_number}</TableCell>,
            <TableCell key="type">{room.room_type}</TableCell>,
            <TableCell key="building">{room.floor?.building?.name}</TableCell>,
            <TableCell key="floor">{room.floor?.name}</TableCell>,
            <TableCell key="status">{room.status}</TableCell>
          ]}
          headers={<>
            <TableHead>Name</TableHead>
            <TableHead>Room Number</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Building</TableHead>
            <TableHead>Floor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </>}
          emptyMessage="No rooms found"
          onDelete={handleDelete}
          type="room"
        />
      )}
    </div>
  );
}

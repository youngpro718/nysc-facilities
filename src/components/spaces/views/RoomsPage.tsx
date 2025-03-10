
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Room } from "../rooms/types/RoomTypes";
import { GridView } from "./GridView";
import { ListView } from "./ListView";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, RefreshCcw, Grid, List } from "lucide-react";
import { StatusEnum } from "../rooms/types/roomEnums";
import { CreateSpaceDialog } from "../CreateSpaceDialog";
import { RoomTable } from "../rooms/RoomTable";

// Define SortOption type to include all possible sorting options
type SortOption = 
  | "name_asc" 
  | "name_desc" 
  | "status_asc" 
  | "status_desc" 
  | "room_number_asc" 
  | "room_number_desc"
  | "type_asc"
  | "type_desc";

interface RoomsPageProps {
  selectedBuilding: string;
  selectedFloor: string;
}

export function RoomsPage({ selectedBuilding, selectedFloor }: RoomsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name_asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list" | "table">("grid");

  const { data: rooms, isLoading, refetch } = useQuery({
    queryKey: ["rooms", selectedBuilding, selectedFloor],
    queryFn: async () => {
      let query = supabase
        .from("rooms")
        .select(`
          *,
          floor:floor_id (
            id,
            name,
            building:building_id (
              id,
              name
            )
          ),
          space_connections:space_connections (
            id,
            from_space_id,
            to_space_id,
            connection_type,
            direction,
            status,
            to_space:to_space_id (
              id,
              name,
              type
            )
          )
        `);

      if (selectedBuilding !== "all") {
        query = query.eq("floor.building.id", selectedBuilding);
      }

      if (selectedFloor !== "all") {
        query = query.eq("floor_id", selectedFloor);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Room[];
    },
  });

  const filteredRooms = rooms
    ? rooms.filter((room) => {
        // Apply status filter
        if (statusFilter !== "all" && room.status !== statusFilter) {
          return false;
        }

        // Apply search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            room.name.toLowerCase().includes(query) ||
            room.room_number.toLowerCase().includes(query) ||
            (room.description?.toLowerCase().includes(query) || false)
          );
        }

        return true;
      })
    : [];

  const sortedRooms = [...filteredRooms].sort((a, b) => {
    if (sortBy === "name_asc") return a.name.localeCompare(b.name);
    if (sortBy === "name_desc") return b.name.localeCompare(a.name);
    if (sortBy === "status_asc") return a.status.localeCompare(b.status);
    if (sortBy === "status_desc") return b.status.localeCompare(a.status);
    if (sortBy === "room_number_asc") return a.room_number.localeCompare(b.room_number);
    if (sortBy === "room_number_desc") return b.room_number.localeCompare(a.room_number);
    if (sortBy === "type_asc") return (a.room_type || "").localeCompare(b.room_type || "");
    if (sortBy === "type_desc") return (b.room_type || "").localeCompare(a.room_type || "");
    return 0;
  });

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center p-8">Loading rooms...</div>;
    }

    if (!sortedRooms.length) {
      return (
        <div className="text-center p-8">
          <p className="mb-4">No rooms found.</p>
          <CreateSpaceDialog />
        </div>
      );
    }

    if (view === "grid") {
      return <GridView rooms={sortedRooms} />;
    } else if (view === "list") {
      return <ListView rooms={sortedRooms} />;
    } else {
      return <RoomTable rooms={sortedRooms} onDelete={() => {}} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row justify-between">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search rooms..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={sortBy}
            onValueChange={(value: string) => setSortBy(value as SortOption)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name_asc">Name (A-Z)</SelectItem>
              <SelectItem value="name_desc">Name (Z-A)</SelectItem>
              <SelectItem value="room_number_asc">Room Number (Asc)</SelectItem>
              <SelectItem value="room_number_desc">Room Number (Desc)</SelectItem>
              <SelectItem value="status_asc">Status (A-Z)</SelectItem>
              <SelectItem value="status_desc">Status (Z-A)</SelectItem>
              <SelectItem value="type_asc">Type (A-Z)</SelectItem>
              <SelectItem value="type_desc">Type (Z-A)</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={StatusEnum.ACTIVE}>Active</SelectItem>
              <SelectItem value={StatusEnum.INACTIVE}>Inactive</SelectItem>
              <SelectItem value={StatusEnum.UNDER_MAINTENANCE}>
                Under Maintenance
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setView("grid")}
            className={view === "grid" ? "bg-muted" : ""}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setView("list")}
            className={view === "list" ? "bg-muted" : ""}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <CreateSpaceDialog />
        </div>
      </div>

      {renderContent()}
    </div>
  );
}

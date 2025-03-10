import { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, ArrowDown, ArrowUp, List, Grid } from "lucide-react";
import { useRoomsQuery } from "../hooks/queries/useRoomsQuery";
import { Room } from "../rooms/types/RoomTypes";
import GridView from "../components/GridView";
import ListView from "../components/ListView";
import { Button } from "@/components/ui/button";

// Define proper types for sort options
type SortOption = 
  | "name_asc" 
  | "name_desc" 
  | "status_asc" 
  | "status_desc"
  | "room_number_asc" 
  | "room_number_desc"; 

const RoomsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name_asc");
  const [view, setView] = useState<"grid" | "list">("grid");
  const { buildingId, floorId } = useParams();
  const location = useLocation();

  // Use the proper query hook
  const { data: rooms, isLoading, error } = useRoomsQuery({
    buildingId: buildingId === 'all' ? undefined : buildingId,
    floorId: floorId === 'all' ? undefined : floorId,
  });

  // Filtering function
  const filteredRooms = rooms?.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.room_number.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Sorting function
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    if (sortBy === "name_asc") return a.name.localeCompare(b.name);
    if (sortBy === "name_desc") return b.name.localeCompare(a.name);
    if (sortBy === "status_asc") return a.status.localeCompare(b.status);
    if (sortBy === "status_desc") return b.status.localeCompare(a.status);
    if (sortBy === "room_number_asc") return a.room_number.localeCompare(b.room_number);
    if (sortBy === "room_number_desc") return b.room_number.localeCompare(a.room_number);
    return 0;
  });
  
  // Reset search when location changes
  useEffect(() => {
    setSearchTerm("");
  }, [location]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading rooms: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search rooms..."
            className="px-3 py-2 border rounded-md"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={() => setSortBy(sortBy === "name_asc" ? "name_desc" : "name_asc")}
          >
            Name {sortBy === "name_asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            onClick={() => setSortBy(sortBy === "room_number_asc" ? "room_number_desc" : "room_number_asc")}
          >
            Room # {sortBy === "room_number_asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />}
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant={view === "grid" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setView("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button 
            variant={view === "list" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div>Loading rooms...</div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Rooms ({sortedRooms.length})</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {view === "grid" ? (
              <GridView data={sortedRooms} />
            ) : (
              <ListView data={sortedRooms} />
            )}
          </TabsContent>
          
          <TabsContent value="active">
            {view === "grid" ? (
              <GridView data={sortedRooms.filter(room => room.status === "active")} />
            ) : (
              <ListView data={sortedRooms.filter(room => room.status === "active")} />
            )}
          </TabsContent>
          
          <TabsContent value="inactive">
            {view === "grid" ? (
              <GridView data={sortedRooms.filter(room => room.status === "inactive")} />
            ) : (
              <ListView data={sortedRooms.filter(room => room.status === "inactive")} />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default RoomsPage;

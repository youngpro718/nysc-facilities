
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Search, ArrowUpDown, Grid, List } from "lucide-react";
import { GridView } from "./GridView";
import { ListView } from "./ListView";
import { TableHead, TableCell } from "@/components/ui/table";
import { RoomCard } from "../rooms/RoomCard";
import { useRoomData } from "../hooks/useRoomData";
import { Room } from "../rooms/types/RoomTypes";
import { Badge } from "@/components/ui/badge";

interface RoomPageParams {
  buildingId?: string;
  floorId?: string;
}

export function RoomsPage() {
  const params = useParams<RoomPageParams>();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "type" | "status">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { rooms, isLoading, deleteRoom } = useRoomData({
    selectedBuilding: params.buildingId,
    selectedFloor: params.floorId
  });

  // Filter and sort rooms
  const filteredRooms = rooms?.filter(room => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        room.name.toLowerCase().includes(query) ||
        room.room_number.toLowerCase().includes(query)
      );
    }

    if (activeTab === "all") return true;
    if (activeTab === "storage") return room.is_storage;
    if (activeTab === "offices") return room.room_type.toString().includes("office");
    if (activeTab === "courtrooms") return room.room_type.toString().includes("courtroom");
    
    return true;
  }) || [];

  // Sort rooms
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    if (sortBy === "name") {
      return sortOrder === "asc" 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    
    if (sortBy === "type") {
      return sortOrder === "asc"
        ? a.room_type.toString().localeCompare(b.room_type.toString())
        : b.room_type.toString().localeCompare(a.room_type.toString());
    }
    
    if (sortBy === "status") {
      return sortOrder === "asc"
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    }
    
    return 0;
  });

  const toggleSortOrder = (field: "name" | "type" | "status") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // List view row renderer
  const renderRow = (room: Room) => [
    <TableCell key="name">{room.name}</TableCell>,
    <TableCell key="number">{room.room_number}</TableCell>,
    <TableCell key="type">{room.room_type.toString()}</TableCell>,
    <TableCell key="floor">{room.floor?.name}</TableCell>,
    <TableCell key="building">{room.floor?.building?.name}</TableCell>,
    <TableCell key="status">
      <Badge variant={room.status === "active" ? "default" : "destructive"}>
        {room.status}
      </Badge>
    </TableCell>
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Rooms</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Room
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rooms..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleSortOrder("name")}
          >
            Name {sortBy === "name" && (sortOrder === "asc" ? <ArrowUpDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />)}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleSortOrder("type")}
          >
            Type {sortBy === "type" && (sortOrder === "asc" ? <ArrowUpDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />)}
          </Button>
          <div className="flex ml-auto">
            <Button
              variant={view === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setView("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Rooms</TabsTrigger>
          <TabsTrigger value="offices">Offices</TabsTrigger>
          <TabsTrigger value="courtrooms">Courtrooms</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {view === "grid" ? (
            <GridView
              items={sortedRooms}
              renderItem={(room) => <RoomCard room={room} onDelete={deleteRoom} />}
              emptyMessage="No rooms found"
            />
          ) : (
            <ListView
              items={sortedRooms}
              renderRow={renderRow}
              headers={<>
                <TableHead>Name</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Building</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </>}
              emptyMessage="No rooms found"
              onDelete={deleteRoom}
            />
          )}
        </TabsContent>

        <TabsContent value="offices" className="mt-6">
          {view === "grid" ? (
            <GridView
              items={sortedRooms}
              renderItem={(room) => <RoomCard room={room} onDelete={deleteRoom} />}
              emptyMessage="No office rooms found"
            />
          ) : (
            <ListView
              items={sortedRooms}
              renderRow={renderRow}
              headers={<>
                <TableHead>Name</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Building</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </>}
              emptyMessage="No office rooms found"
              onDelete={deleteRoom}
            />
          )}
        </TabsContent>

        <TabsContent value="courtrooms" className="mt-6">
          {view === "grid" ? (
            <GridView
              items={sortedRooms}
              renderItem={(room) => <RoomCard room={room} onDelete={deleteRoom} />}
              emptyMessage="No courtrooms found"
            />
          ) : (
            <ListView
              items={sortedRooms}
              renderRow={renderRow}
              headers={<>
                <TableHead>Name</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Building</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </>}
              emptyMessage="No courtrooms found"
              onDelete={deleteRoom}
            />
          )}
        </TabsContent>

        <TabsContent value="storage" className="mt-6">
          {view === "grid" ? (
            <GridView
              items={sortedRooms}
              renderItem={(room) => <RoomCard room={room} onDelete={deleteRoom} />}
              emptyMessage="No storage rooms found"
            />
          ) : (
            <ListView
              items={sortedRooms}
              renderRow={renderRow}
              headers={<>
                <TableHead>Name</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Building</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </>}
              emptyMessage="No storage rooms found" 
              onDelete={deleteRoom}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

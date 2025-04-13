import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Building, User, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RoomAssignment {
  id: string;
  room_id: string;
  occupant_id: string;
  assigned_at: string;
  is_primary: boolean;
  assignment_type: string | null;
  room: {
    id: string;
    name: string;
    room_number: string;
    floor: {
      id: string;
      name: string;
      building: {
        id: string;
        name: string;
      };
    };
  };
  occupant: {
    id: string;
    first_name: string;
    last_name: string;
    title: string | null;
    department: string | null;
  };
}

export function RoomAssignmentsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [viewType, setViewType] = useState<"rooms" | "occupants">("rooms");

  const { data: assignments, isLoading, refetch } = useQuery({
    queryKey: ["room-assignments", searchQuery, buildingFilter, viewType],
    queryFn: async () => {
      console.log("Fetching room assignments...");
      
      try {
        // First, check if the table exists and has data
        const { count, error: countError } = await supabase
          .from("occupant_room_assignments")
          .select("*", { count: "exact", head: true });
        
        if (countError) {
          console.error("Error checking occupant_room_assignments table:", countError);
          throw countError;
        }
        
        console.log(`Found ${count} room assignments in the database`);
        
        if (count === 0) {
          return [];
        }

        // Let's try a simpler query first to get just the basic data
        const { data, error } = await supabase
          .from("occupant_room_assignments")
          .select(`
            id,
            room_id,
            occupant_id,
            assigned_at,
            is_primary,
            assignment_type
          `)
          .order("assigned_at", { ascending: false });

        if (error) {
          console.error("Error fetching room assignments:", error);
          throw error;
        }

        console.log("Basic room assignments data:", data);

        // Now let's fetch the related room and occupant data separately
        const roomIds = [...new Set(data.map(a => a.room_id))];
        const occupantIds = [...new Set(data.map(a => a.occupant_id))];

        // Fetch rooms data
        const { data: roomsData, error: roomsError } = await supabase
          .from("rooms")
          .select(`
            id,
            name,
            room_number,
            floor_id,
            floors!inner (
              id,
              name,
              building_id,
              buildings!inner (
                id,
                name
              )
            )
          `)
          .in("id", roomIds);

        if (roomsError) {
          console.error("Error fetching rooms data:", roomsError);
          throw roomsError;
        }

        // Fetch occupants data
        const { data: occupantsData, error: occupantsError } = await supabase
          .from("occupants")
          .select(`
            id,
            first_name,
            last_name,
            title,
            department
          `)
          .in("id", occupantIds);

        if (occupantsError) {
          console.error("Error fetching occupants data:", occupantsError);
          throw occupantsError;
        }

        // Create lookup maps for rooms and occupants
        const roomsMap = roomsData.reduce((acc, room) => {
          acc[room.id] = {
            id: room.id,
            name: room.name,
            room_number: room.room_number,
            floor: {
              id: room.floors.id,
              name: room.floors.name,
              building: {
                id: room.floors.buildings.id,
                name: room.floors.buildings.name
              }
            }
          };
          return acc;
        }, {});

        const occupantsMap = occupantsData.reduce((acc, occupant) => {
          acc[occupant.id] = occupant;
          return acc;
        }, {});

        // Combine the data
        const combinedData = data.map(assignment => ({
          ...assignment,
          room: roomsMap[assignment.room_id],
          occupant: occupantsMap[assignment.occupant_id]
        }));

        console.log("Combined room assignments data:", combinedData);

        // Handle filtering in JavaScript
        let filteredData = combinedData;
        
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          filteredData = filteredData.filter(assignment => {
            if (viewType === "rooms") {
              return (
                assignment.room?.name?.toLowerCase().includes(searchLower) ||
                assignment.room?.room_number?.toLowerCase().includes(searchLower) ||
                assignment.room?.floor?.building?.name?.toLowerCase().includes(searchLower)
              );
            } else {
              return (
                assignment.occupant?.first_name?.toLowerCase().includes(searchLower) ||
                assignment.occupant?.last_name?.toLowerCase().includes(searchLower) ||
                (assignment.occupant?.department?.toLowerCase() || "").includes(searchLower)
              );
            }
          });
        }
        
        if (buildingFilter !== "all") {
          filteredData = filteredData.filter(assignment => 
            assignment.room?.floor?.building?.id === buildingFilter
          );
        }
        
        return filteredData as RoomAssignment[];
      } catch (error) {
        console.error("Error in room assignments query:", error);
        throw error;
      }
    },
  });

  const { data: buildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buildings")
        .select("id, name")
        .order("name");

      if (error) {
        console.error("Error fetching buildings:", error);
        throw error;
      }

      return data;
    },
  });

  // Group assignments by room or occupant depending on view type
  const groupedAssignments = assignments?.reduce((acc, assignment) => {
    const key = viewType === "rooms" 
      ? assignment.room_id 
      : assignment.occupant_id;
    
    if (!acc[key]) {
      acc[key] = [];
    }
    
    acc[key].push(assignment);
    return acc;
  }, {} as Record<string, RoomAssignment[]>) || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${viewType === "rooms" ? "rooms" : "occupants"}...`}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={buildingFilter} onValueChange={setBuildingFilter}>
            <SelectTrigger className="w-[180px]">
              <Building className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Building" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Buildings</SelectItem>
              {buildings?.map((building) => (
                <SelectItem key={building.id} value={building.id}>
                  {building.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        <Tabs value={viewType} onValueChange={(v) => setViewType(v as "rooms" | "occupants")} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rooms" className="flex items-center gap-1">
              <Building className="h-4 w-4" />
              By Room
            </TabsTrigger>
            <TabsTrigger value="occupants" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              By Occupant
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : assignments?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
              No room assignments found. Try adjusting your search or filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {viewType === "rooms" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Room</TableHead>
                  <TableHead>Building & Floor</TableHead>
                  <TableHead>Occupants</TableHead>
                  <TableHead className="text-right">Assignment Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedAssignments).map(([roomId, roomAssignments]) => {
                  const room = roomAssignments[0].room;
                  return (
                    <TableRow key={roomId}>
                      <TableCell className="font-medium">
                        {room?.name} ({room?.room_number})
                      </TableCell>
                      <TableCell>
                        {room?.floor?.building?.name}, {room?.floor?.name}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {roomAssignments.map((assignment) => (
                            <div key={assignment.id} className="flex items-center gap-2">
                              <span>
                                {assignment.occupant?.first_name} {assignment.occupant?.last_name}
                              </span>
                              {assignment.is_primary && (
                                <Badge variant="outline" className="text-xs">Primary</Badge>
                              )}
                              {assignment.assignment_type && (
                                <Badge variant="secondary" className="text-xs capitalize">
                                  {assignment.assignment_type.replace(/_/g, ' ')}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {new Date(roomAssignments[0].assigned_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Occupant</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Assigned Rooms</TableHead>
                  <TableHead className="text-right">Assignment Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedAssignments).map(([occupantId, occupantAssignments]) => {
                  const occupant = occupantAssignments[0].occupant;
                  return (
                    <TableRow key={occupantId}>
                      <TableCell className="font-medium">
                        {occupant?.first_name} {occupant?.last_name}
                        {occupant?.title && (
                          <div className="text-xs text-muted-foreground">{occupant.title}</div>
                        )}
                      </TableCell>
                      <TableCell>{occupant?.department || "—"}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {occupantAssignments.map((assignment) => (
                            <div key={assignment.id} className="flex items-center gap-2">
                              <span>
                                {assignment.room?.room_number} - {assignment.room?.name}
                              </span>
                              {assignment.is_primary && (
                                <Badge variant="outline" className="text-xs">Primary</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {new Date(occupantAssignments[0].assigned_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}

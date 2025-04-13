import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Key, User, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface KeyData {
  id: string;
  name: string;
  type: string;
  location_data: {
    room_id?: string;
    room_name?: string;
    building_name?: string;
    floor_name?: string;
  };
}

interface OccupantData {
  id: string;
  first_name: string;
  last_name: string;
  title: string | null;
  department: string | null;
}

interface KeyAssignment {
  id: string;
  key_id: string;
  occupant_id: string;
  assigned_at: string;
  returned_at: string | null;
  key?: KeyData;
  occupant?: OccupantData;
}

export function KeyAssignmentsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "returned">("active");
  const [viewType, setViewType] = useState<"keys" | "occupants">("keys");

  const { data: assignments, isLoading, refetch, error } = useQuery({
    queryKey: ["key-assignments", searchQuery, statusFilter, viewType],
    queryFn: async () => {
      console.log("Fetching key assignments...");
      
      try {
        // First, check if the table exists and has data
        const { count, error: countError } = await supabase
          .from("key_assignments")
          .select("*", { count: "exact", head: true });
        
        if (countError) {
          console.error("Error checking key_assignments table:", countError);
          throw countError;
        }
        
        console.log(`Found ${count} key assignments in the database`);
        
        if (count === 0) {
          return [];
        }

        // Fetch basic assignment data
        let query = supabase
          .from("key_assignments")
          .select(`
            id,
            key_id,
            occupant_id,
            assigned_at,
            returned_at
          `);
        
        // Apply status filter
        if (statusFilter === "active") {
          query = query.is("returned_at", null);
        } else if (statusFilter === "returned") {
          query = query.not("returned_at", "is", null);
        }

        const { data, error } = await query.order("assigned_at", { ascending: false });

        if (error) {
          console.error("Error fetching key assignments:", error);
          throw error;
        }

        console.log("Basic key assignments data:", data);

        // Now fetch related key and occupant data separately
        const keyIds = [...new Set(data.map(a => a.key_id))];
        const occupantIds = [...new Set(data.map(a => a.occupant_id))];

        // Fetch keys data
        const { data: keysData = [], error: keysError } = await supabase
          .from("keys")
          .select(`
            id,
            name,
            type,
            location_data
          `)
          .in("id", keyIds);

        if (keysError) {
          console.error("Error fetching keys data:", keysError);
          throw keysError;
        }

        // Fetch occupants data
        const { data: occupantsData = [], error: occupantsError } = await supabase
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

        // Create lookup maps
        const keysMap: Record<string, KeyData> = {};
        keysData.forEach((key: any) => {
          if (key && typeof key === 'object' && 'id' in key && key.id) {
            // Handle both old and new schema formats
            keysMap[key.id] = {
              id: key.id,
              name: key.name || key.key_number || '',
              type: key.type || key.key_type || '',
              location_data: key.location_data || {}
            };
          }
        });

        const occupantsMap: Record<string, OccupantData> = {};
        occupantsData.forEach((occupant: any) => {
          if (occupant && typeof occupant === 'object' && 'id' in occupant && occupant.id) {
            occupantsMap[occupant.id] = {
              id: occupant.id,
              first_name: occupant.first_name ?? '',
              last_name: occupant.last_name ?? '',
              title: occupant.title,
              department: occupant.department
            };
          }
        });

        // Combine the data
        const combinedData = data.map(assignment => ({
          ...assignment,
          key: keysMap[assignment.key_id],
          occupant: occupantsMap[assignment.occupant_id]
        }));

        console.log("Combined key assignments data:", combinedData);

        // Handle filtering in JavaScript
        let filteredData = combinedData;
        
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          filteredData = filteredData.filter(assignment => {
            if (viewType === "keys") {
              return (
                assignment.key?.name?.toLowerCase().includes(searchLower) ||
                assignment.key?.type?.toLowerCase().includes(searchLower) ||
                assignment.key?.location_data?.room_name?.toLowerCase().includes(searchLower) ||
                assignment.key?.location_data?.building_name?.toLowerCase().includes(searchLower)
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
        
        return filteredData as KeyAssignment[];
      } catch (error) {
        console.error("Error in key assignments query:", error);
        throw error;
      }
    },
  });

  // Group assignments by key or occupant depending on view type
  const groupedAssignments = assignments?.reduce((acc, assignment) => {
    const key = viewType === "keys" 
      ? assignment.key_id 
      : assignment.occupant_id;
    
    if (!acc[key]) {
      acc[key] = [];
    }
    
    acc[key].push(assignment);
    return acc;
  }, {} as Record<string, KeyAssignment[]>) || {};

  if (error) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-lg text-center text-error">
          Error fetching key assignments: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search keys or occupants..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "active" | "returned")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="returned">Returned Only</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs value={viewType} onValueChange={(value) => setViewType(value as "keys" | "occupants")}>
        <TabsList className="mb-4">
          <TabsTrigger value="keys">
            <Key className="mr-2 h-4 w-4" />
            Group by Keys
          </TabsTrigger>
          <TabsTrigger value="occupants">
            <User className="mr-2 h-4 w-4" />
            Group by Occupants
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="keys" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : Object.keys(groupedAssignments).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center">
                  No key assignments found. Try adjusting your search or filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedAssignments).map(([keyId, keyAssignments]) => {
                const keyData = keyAssignments[0]?.key;
                if (!keyData) return null;
                
                return (
                  <Card key={keyId}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center">
                            <Key className="mr-2 h-5 w-5" />
                            {keyData.name || "Unnamed Key"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Type: {keyData.type || "Unknown"}
                          </p>
                          {keyData.location_data?.room_name && (
                            <p className="text-sm text-muted-foreground">
                              Location: {keyData.location_data.room_name}, {keyData.location_data.building_name}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline">
                          {keyAssignments.filter(a => !a.returned_at).length} Active
                        </Badge>
                      </div>
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Occupant</TableHead>
                            <TableHead>Assigned</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {keyAssignments.map(assignment => (
                            <TableRow key={assignment.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {assignment.occupant?.first_name} {assignment.occupant?.last_name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {assignment.occupant?.department || "No department"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {new Date(assignment.assigned_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {assignment.returned_at ? (
                                  <Badge variant="secondary">
                                    Returned {new Date(assignment.returned_at).toLocaleDateString()}
                                  </Badge>
                                ) : (
                                  <Badge>Active</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="occupants" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : Object.keys(groupedAssignments).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center">
                  No key assignments found. Try adjusting your search or filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedAssignments).map(([occupantId, occupantAssignments]) => {
                const occupantData = occupantAssignments[0]?.occupant;
                if (!occupantData) return null;
                
                return (
                  <Card key={occupantId}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center">
                            <User className="mr-2 h-5 w-5" />
                            {occupantData.first_name} {occupantData.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {occupantData.title || "No title"} • {occupantData.department || "No department"}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {occupantAssignments.filter(a => !a.returned_at).length} Active Keys
                        </Badge>
                      </div>
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Key</TableHead>
                            <TableHead>Assigned</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {occupantAssignments.map(assignment => (
                            <TableRow key={assignment.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {assignment.key?.name || "Unnamed Key"}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {assignment.key?.type || "Unknown type"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {new Date(assignment.assigned_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {assignment.returned_at ? (
                                  <Badge variant="secondary">
                                    Returned {new Date(assignment.returned_at).toLocaleDateString()}
                                  </Badge>
                                ) : (
                                  <Badge>Active</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, RefreshCw, Calendar, Building, Key } from "lucide-react";
import { format } from "date-fns";
import { PostgrestSingleResponse } from "@supabase/supabase-js";

type ActionType = "assigned" | "returned" | "changed";

interface HistoryItem {
  id: string;
  occupant_id: string;
  type: "room" | "key";
  action: ActionType;
  item_id: string;
  timestamp: string;
  details: any;
  occupant: {
    id: string;
    first_name: string;
    last_name: string;
    title: string | null;
    department: string | null;
  };
}

export function AssignmentHistoryView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "room" | "key">("all");
  const [dateRange, setDateRange] = useState<"all" | "week" | "month" | "year">("month");

  const { data: historyItems, isLoading, refetch } = useQuery({
    queryKey: ["assignment-history", searchQuery, typeFilter, dateRange],
    queryFn: async () => {
      console.log("Fetching assignment history...");
      
      try {
        // Get date range for filtering
        const now = new Date();
        let startDate = new Date();
        if (dateRange === "week") {
          startDate.setDate(now.getDate() - 7);
        } else if (dateRange === "month") {
          startDate.setMonth(now.getMonth() - 1);
        } else if (dateRange === "year") {
          startDate.setFullYear(now.getFullYear() - 1);
        } else {
          // "all" - no date filtering
          startDate = new Date(0); // Beginning of time
        }
        
        const startDateString = startDate.toISOString();
        
        // Fetch room assignment history
        const roomPromise = supabase
          .from("occupant_room_assignments")
          .select(`
            id,
            occupant_id,
            room_id,
            assigned_at,
            is_primary,
            assignment_type
          `)
          .gte("assigned_at", dateRange === "all" ? null : startDateString)
          .order("assigned_at", { ascending: false });
          
        // Fetch key assignment history
        const keyPromise = supabase
          .from("key_assignments")
          .select(`
            id,
            occupant_id,
            key_id,
            assigned_at,
            returned_at
          `)
          .or(
            `assigned_at.gte.${dateRange === "all" ? '1900-01-01' : startDateString},returned_at.gte.${dateRange === "all" ? '1900-01-01' : startDateString}`
          )
          .order("assigned_at", { ascending: false });
          
        // Execute both queries in parallel
        const [roomResult, keyResult] = await Promise.all([
          typeFilter === "key" ? { data: [], error: null } as PostgrestSingleResponse<any> : roomPromise,
          typeFilter === "room" ? { data: [], error: null } as PostgrestSingleResponse<any> : keyPromise
        ]);
        
        if (roomResult.error) {
          console.error("Error fetching room assignment history:", roomResult.error);
          throw roomResult.error;
        }
        
        if (keyResult.error) {
          console.error("Error fetching key assignment history:", keyResult.error);
          throw keyResult.error;
        }
        
        // Transform room assignments to history items
        const roomHistoryItems = (roomResult.data || []).map(assignment => ({
          id: `room_${assignment.id}`,
          occupant_id: assignment.occupant_id,
          type: "room" as const,
          action: "assigned" as const,
          item_id: assignment.room_id,
          timestamp: assignment.assigned_at,
          details: {
            is_primary: assignment.is_primary,
            assignment_type: assignment.assignment_type
          }
        }));
        
        // Transform key assignments to history items
        const keyHistoryItems = (keyResult.data || []).flatMap(assignment => {
          const items = [{
            id: `key_assigned_${assignment.id}`,
            occupant_id: assignment.occupant_id,
            type: "key" as const,
            action: "assigned" as const,
            item_id: assignment.key_id,
            timestamp: assignment.assigned_at,
            details: {}
          }];
          
          // Add return event if key was returned
          if (assignment.returned_at) {
            items.push({
              id: `key_returned_${assignment.id}`,
              occupant_id: assignment.occupant_id,
              type: "key" as const,
              action: "assigned" as const,
              item_id: assignment.key_id,
              timestamp: assignment.returned_at,
              details: {
                returned: true
              }
            });
          }
          
          return items;
        });
        
        // Combine all history items
        const allHistoryItems = [...roomHistoryItems, ...keyHistoryItems]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
        console.log("Combined history items:", allHistoryItems);
        
        // Get all unique occupant IDs
        const occupantIds = [...new Set(allHistoryItems.map(item => item.occupant_id))];
        
        // Fetch occupant data
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
        
        // Create occupants lookup map
        const occupantsMap = occupantsData.reduce((acc, occupant) => {
          acc[occupant.id] = occupant;
          return acc;
        }, {} as Record<string, any>);
        
        // Fetch room and key details
        const roomIds = roomHistoryItems.map(item => item.item_id);
        const keyIds = keyHistoryItems.map(item => item.item_id);
        
        const roomsPromise = roomIds.length > 0 ? supabase
          .from("rooms")
          .select(`
            id,
            name,
            room_number,
            floors!inner (
              id,
              name,
              buildings!inner (
                id,
                name
              )
            )
          `)
          .in("id", roomIds) : Promise.resolve({ data: [], error: null } as PostgrestSingleResponse<any>);
          
        const keysPromise = keyIds.length > 0 ? supabase
          .from("keys")
          .select(`
            id,
            name,
            type,
            location_data
          `)
          .in("id", keyIds) : Promise.resolve({ data: [], error: null } as PostgrestSingleResponse<any>);
          
        const [roomsResult, keysResult] = await Promise.all([roomsPromise, keysPromise]);
        
        if (roomsResult.error) {
          console.error("Error fetching rooms data:", roomsResult.error);
          throw roomsResult.error;
        }
        
        if (keysResult.error) {
          console.error("Error fetching keys data:", keysResult.error);
          throw keysResult.error;
        }
        
        // Create lookup maps
        const roomsMap = (roomsResult.data || []).reduce((acc, room) => {
          try {
            if (room && typeof room === 'object' && 'id' in room) {
              acc[room.id] = room;
            }
          } catch (e) {
            console.error("Error processing room data:", e);
          }
          return acc;
        }, {} as Record<string, any>);
        
        const keysMap = (keysResult.data || []).reduce((acc, key) => {
          try {
            if (key && typeof key === 'object' && 'id' in key) {
              // Ensure we have the correct structure even if the database schema is different
              acc[key.id] = {
                id: key.id,
                name: key.name || key.key_number || 'Unknown Key',
                type: key.type || key.key_type || 'Unknown Type',
                location_data: key.location_data || {}
              };
            }
          } catch (e) {
            console.error("Error processing key data:", e);
          }
          return acc;
        }, {} as Record<string, any>);
        
        // Combine all data
        const combinedHistoryItems = allHistoryItems.map(item => {
          try {
            return {
              ...item,
              occupant: occupantsMap[item.occupant_id] || { 
                id: item.occupant_id,
                first_name: "Unknown",
                last_name: "Occupant",
                title: null,
                department: null
              },
              itemDetails: item.type === "room" 
                ? (roomsMap[item.item_id] || { id: item.item_id, name: "Unknown Room" })
                : (keysMap[item.item_id] || { id: item.item_id, name: "Unknown Key", type: "Unknown" })
            };
          } catch (e) {
            console.error("Error combining history item:", e);
            return {
              ...item,
              occupant: { id: item.occupant_id, first_name: "Error", last_name: "Loading", title: null, department: null },
              itemDetails: { id: item.item_id, name: "Error Loading" }
            };
          }
        });

        // Apply search filtering
        let filteredItems = combinedHistoryItems;
        
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          filteredItems = filteredItems.filter(item => {
            // Search by occupant name
            const occupantMatch = 
              item.occupant?.first_name?.toLowerCase().includes(searchLower) ||
              item.occupant?.last_name?.toLowerCase().includes(searchLower) ||
              (item.occupant?.department?.toLowerCase() || "").includes(searchLower);
              
            // Search by item details
            let itemMatch = false;
            if (item.type === "room" && item.itemDetails) {
              itemMatch = 
                item.itemDetails.name?.toLowerCase().includes(searchLower) ||
                item.itemDetails.room_number?.toLowerCase().includes(searchLower) ||
                item.itemDetails.floors?.name?.toLowerCase().includes(searchLower) ||
                item.itemDetails.floors?.buildings?.name?.toLowerCase().includes(searchLower);
            } else if (item.type === "key" && item.itemDetails) {
              itemMatch = 
                item.itemDetails.name?.toLowerCase().includes(searchLower) ||
                item.itemDetails.type?.toLowerCase().includes(searchLower) ||
                item.itemDetails.location_data?.room_name?.toLowerCase().includes(searchLower) ||
                item.itemDetails.location_data?.building_name?.toLowerCase().includes(searchLower);
            }
            
            return occupantMatch || itemMatch;
          });
        }
        
        return filteredItems as (HistoryItem & { itemDetails: any })[];
      } catch (error) {
        console.error("Error in assignment history query:", error);
        throw error;
      }
    },
  });

  // Format the timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM d, yyyy h:mm a");
    } catch (e) {
      return timestamp;
    }
  };

  // Get item description based on type and action
  const getItemDescription = (item: any) => {
    if (item.type === "room") {
      const room = item.itemDetails;
      if (!room) return "Unknown Room";
      
      return (
        <div>
          <div className="flex items-center gap-1">
            <Building className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Room {room.room_number} - {room.name}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {room.floors?.buildings?.name}, {room.floors?.name}
          </div>
        </div>
      );
    } else if (item.type === "key") {
      const key = item.itemDetails;
      if (!key) return "Unknown Key";
      
      return (
        <div>
          <div className="flex items-center gap-1">
            <Key className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Key {key.name} ({key.type})</span>
          </div>
          {key.location_data?.room_name && (
            <div className="text-xs text-muted-foreground">
              {key.location_data.room_name}, {key.location_data.building_name}
            </div>
          )}
        </div>
      );
    }
    
    return "Unknown Item";
  };

  // Get action badge based on type and action
  const getActionBadge = (item: any) => {
    if (item.action === "assigned") {
      return <Badge variant="default">Assigned</Badge>;
    } else if (item.action === "returned") {
      return <Badge variant="secondary">Returned</Badge>;
    } else if (item.action === "changed") {
      return <Badge variant="outline">Changed</Badge>;
    }
    
    return <Badge variant="outline">Unknown</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search history..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as "all" | "room" | "key")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="room">Rooms Only</SelectItem>
              <SelectItem value="key">Keys Only</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as "all" | "week" | "month" | "year")}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
              <SelectItem value="year">Past Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : historyItems?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
              No assignment history found. Try adjusting your search or filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Date & Time</TableHead>
              <TableHead className="w-[200px]">Occupant</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="w-[100px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historyItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {formatTimestamp(item.timestamp)}
                </TableCell>
                <TableCell>
                  <div>
                    {item.occupant?.first_name} {item.occupant?.last_name}
                    {item.occupant?.title && (
                      <div className="text-xs text-muted-foreground">{item.occupant.title}</div>
                    )}
                    {item.occupant?.department && (
                      <div className="text-xs text-muted-foreground">{item.occupant.department}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getItemDescription(item)}
                </TableCell>
                <TableCell>
                  {getActionBadge(item)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

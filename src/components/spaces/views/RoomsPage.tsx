
import React, { useState, useMemo } from 'react';
import { useRoomsQuery } from "../hooks/queries/useRoomsQuery";
import { filterSpaces, SortOption } from "../utils/spaceFilters";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { FilterBar } from "../rooms/components/FilterBar";
import { RoomsContent } from "../rooms/components/RoomsContent";
import { Room } from "../rooms/types/RoomTypes";

export function RoomsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name_asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [roomTypeFilter, setRoomTypeFilter] = useState("");
  
  const queryClient = useQueryClient();
  const { data: rooms, isLoading, error } = useRoomsQuery();

  const deleteRoomMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rooms").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Room deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting room:", error);
      toast.error("Failed to delete room");
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      deleteRoomMutation.mutate(id);
    }
  };

  // Apply filters and sorting
  const filteredRooms = useMemo(() => {
    if (!rooms) return [];

    let filtered = [...rooms];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(room => 
        room.name.toLowerCase().includes(query) || 
        room.room_number?.toLowerCase().includes(query) ||
        room.room_type.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(room => room.status.toLowerCase() === statusFilter.toLowerCase());
    }
    
    // Apply room type filter
    if (roomTypeFilter) {
      filtered = filtered.filter(room => 
        room.room_type.toLowerCase() === roomTypeFilter.toLowerCase()
      );
    }
    
    // Apply sorting
    filtered = sortRooms(filtered, sortBy);
    
    return filtered;
  }, [rooms, searchQuery, statusFilter, sortBy, roomTypeFilter]);

  // Sort rooms based on selected sort option
  const sortRooms = (rooms: Room[], sortOption: SortOption): Room[] => {
    return [...rooms].sort((a, b) => {
      switch (sortOption) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'room_number_asc':
          return (a.room_number || '').localeCompare(b.room_number || '');
        case 'room_number_desc':
          return (b.room_number || '').localeCompare(a.room_number || '');
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });
  };

  // Count courtrooms for quick filter
  const courtRoomCount = useMemo(() => {
    return rooms?.filter(room => room.room_type.toLowerCase() === 'courtroom').length || 0;
  }, [rooms]);

  // Handle quick filter for specific room types
  const handleQuickFilter = (filter: string) => {
    setRoomTypeFilter(prev => prev === filter ? '' : filter);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load rooms: {error instanceof Error ? error.message : "Unknown error"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        view={view}
        onViewChange={setView}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["rooms"] })}
        roomTypeFilter={roomTypeFilter}
        onRoomTypeFilterChange={setRoomTypeFilter}
        onQuickFilter={handleQuickFilter}
        courtRoomCount={courtRoomCount}
      />

      <RoomsContent
        isLoading={isLoading}
        rooms={rooms || []}
        filteredRooms={filteredRooms}
        view={view}
        onDelete={handleDelete}
        searchQuery={searchQuery}
      />
    </div>
  );
}

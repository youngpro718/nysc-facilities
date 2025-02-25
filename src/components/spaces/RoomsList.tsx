
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { FilterBar } from "./rooms/components/FilterBar";
import { RoomsContent } from "./rooms/components/RoomsContent";
import { useRoomFilters } from "./hooks/useRoomFilters";
import { useRoomsQuery } from "./hooks/queries/useRoomsQuery";

interface RoomsListProps {
  selectedBuilding: string;
  selectedFloor: string;
}

const RoomsList = ({ selectedBuilding, selectedFloor }: RoomsListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data: rooms, isLoading, error, refetch } = useRoomsQuery({
    buildingId: selectedBuilding === 'all' ? undefined : selectedBuilding,
    floorId: selectedFloor === 'all' ? undefined : selectedFloor,
  });
  
  const { filteredAndSortedRooms } = useRoomFilters({
    rooms,
    searchQuery,
    sortBy,
    statusFilter,
    selectedBuilding,
    selectedFloor,
  });

  const deleteRoom = useMutation({
    mutationFn: async (roomId: string) => {
      const { data: connections } = await supabase
        .from('space_connections')
        .select('id')
        .or(`from_space_id.eq.${roomId},to_space_id.eq.${roomId}`);

      if (connections && connections.length > 0) {
        throw new Error('Cannot delete room with existing connections. Please remove connections first.');
      }

      const { data: assignedKeys } = await supabase
        .from('keys')
        .select('id')
        .contains('location_data', { room_id: roomId });

      if (assignedKeys && assignedKeys.length > 0) {
        throw new Error('Cannot delete room with assigned keys. Please reassign or remove keys first.');
      }

      const { data: occupants } = await supabase
        .from('occupant_room_assignments')
        .select('id')
        .eq('room_id', roomId);

      if (occupants && occupants.length > 0) {
        throw new Error('Cannot delete room with assigned occupants. Please reassign occupants first.');
      }

      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({
        title: "Room deleted",
        description: "The room has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete room. Please try again.",
        variant: "destructive",
      });
      console.error('Error deleting room:', error);
    },
  });

  const handleRefresh = useCallback(() => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Room list has been refreshed.",
    });
  }, [refetch, toast]);

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
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        view={view}
        onViewChange={setView}
        onRefresh={handleRefresh}
      />

      <RoomsContent
        isLoading={isLoading}
        rooms={filteredAndSortedRooms}
        view={view}
        onDelete={(id) => {
          if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
            deleteRoom.mutate(id);
          }
        }}
      />
    </div>
  );
};

export default RoomsList;

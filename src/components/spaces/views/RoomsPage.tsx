
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { FilterBar } from "../rooms/components/FilterBar";
import { RoomsContent } from "../rooms/components/RoomsContent";
import { HierarchyFilters } from "../rooms/components/HierarchyFilters";
import { GroupedRoomsView } from "../rooms/components/GroupedRoomsView";
import { useRoomFilters } from "../hooks/useRoomFilters";
import { useHierarchyFilters } from "../hooks/useHierarchyFilters";
import { useRoomsQuery } from "../hooks/queries/useRoomsQuery";
import { deleteSpace } from "../services/deleteSpace";

// Define a type for sort options to fix the TS error
export type SortOption = 
  | "name_asc" 
  | "name_desc" 
  | "status_asc" 
  | "status_desc"
  | "room_number_asc"
  | "room_number_desc"
  | "room_type_asc"
  | "room_type_desc";

interface RoomsPageProps {
  selectedBuilding: string;
  selectedFloor: string;
}

const RoomsPage = ({ selectedBuilding, selectedFloor }: RoomsPageProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name_asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  
  // Hierarchy filter states
  const [showOnlyParents, setShowOnlyParents] = useState(false);
  const [showOnlyChildren, setShowOnlyChildren] = useState(false);
  const [groupByParent, setGroupByParent] = useState(false);

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
    roomTypeFilter,
  });

  const { 
    filteredRooms: hierarchyFilteredRooms, 
    groupedRooms, 
    hierarchyStats 
  } = useHierarchyFilters({
    rooms: filteredAndSortedRooms,
    showOnlyParents,
    showOnlyChildren,
    groupByParent,
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (roomId: string) => deleteSpace(roomId, 'room'),
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

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Room list has been refreshed.",
    });
  };

  const handleSort = (value: string) => {
    setSortBy(value as SortOption);
  };

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
        onSortChange={handleSort}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        roomTypeFilter={roomTypeFilter}
        onRoomTypeFilterChange={setRoomTypeFilter}
        view={view}
        onViewChange={setView}
        onRefresh={handleRefresh}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <HierarchyFilters
            showOnlyParents={showOnlyParents}
            onShowOnlyParentsChange={setShowOnlyParents}
            showOnlyChildren={showOnlyChildren}
            onShowOnlyChildrenChange={setShowOnlyChildren}
            groupByParent={groupByParent}
            onGroupByParentChange={setGroupByParent}
            hierarchyStats={hierarchyStats}
          />
        </div>
        
        <div className="lg:col-span-3">
          {groupByParent ? (
            <GroupedRoomsView
              groupedRooms={groupedRooms}
              onDelete={(id) => {
                if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
                  deleteRoomMutation.mutate(id);
                }
              }}
              view={view}
            />
          ) : (
            <RoomsContent
              isLoading={isLoading}
              rooms={rooms || []}
              filteredRooms={hierarchyFilteredRooms}
              view={view}
              onDelete={(id) => {
                if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
                  deleteRoomMutation.mutate(id);
                }
              }}
              searchQuery={searchQuery}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomsPage;

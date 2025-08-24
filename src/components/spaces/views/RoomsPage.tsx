
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { FilterBar } from "../rooms/components/FilterBar";
import { MobileFilterBar } from "../rooms/components/MobileFilterBar";
import { RoomsContent } from "../rooms/components/RoomsContent";
import { HierarchyFilters } from "../rooms/components/HierarchyFilters";
import { GroupedRoomsView } from "../rooms/components/GroupedRoomsView";
import { RoomDetailsDialog } from "../rooms/components/RoomDetailsDialog";
import { MobileInventoryDialog } from "../rooms/components/MobileInventoryDialog";
import { RoomsSidebarList } from "../rooms/components/RoomsSidebarList";
import { RoomDetailsPanel } from "../rooms/components/RoomDetailsPanel";
import { RoomDetailPanel } from "../components/RoomDetailPanel";
import { CompactRoomList } from "../components/CompactRoomList";
import { RoomCard } from "../rooms/RoomCard";
import { Building } from "lucide-react";
import { useRoomFilters } from "../hooks/useRoomFilters";
import { useHierarchyFilters } from "../hooks/useHierarchyFilters";
import { useRoomsQuery } from "../hooks/queries/useRoomsQuery";
import { deleteSpace } from "../services/deleteSpace";
import { Room } from "../rooms/types/RoomTypes";

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
  
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedRoomForPanel, setSelectedRoomForPanel] = useState<Room | null>(null);
  
  // Check if mobile on mount and resize
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
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

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsRoomDialogOpen(true);
  };

  const handleRoomSelect = (room: Room) => {
    setSelectedRoomForPanel(room);
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
      {/* Filter Bar */}
      {isMobile ? (
        <MobileFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={handleSort}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          roomTypeFilter={roomTypeFilter}
          onRoomTypeFilterChange={setRoomTypeFilter}
          onRefresh={handleRefresh}
        />
      ) : (
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={handleSort}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          roomTypeFilter={roomTypeFilter}
          onRoomTypeFilterChange={setRoomTypeFilter}
          onRefresh={handleRefresh}
        />
      )}

      {/* Hierarchy Filters */}
      {!isMobile && (
        <HierarchyFilters
          showOnlyParents={showOnlyParents}
          onShowOnlyParentsChange={setShowOnlyParents}
          showOnlyChildren={showOnlyChildren}
          onShowOnlyChildrenChange={setShowOnlyChildren}
          groupByParent={groupByParent}
          onGroupByParentChange={setGroupByParent}
          hierarchyStats={hierarchyStats}
        />
      )}

      {/* Main Content Area - Master Detail View */}
      {!isMobile ? (
        <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border">
          <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
            <div className="h-full">
              <RoomsSidebarList
                rooms={hierarchyFilteredRooms}
                selectedRoomId={selectedRoomForPanel?.id}
                onSelect={handleRoomSelect}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={70}>
            <div className="p-6 h-full flex items-center justify-center">
              {selectedRoomForPanel ? (
                <RoomCard
                  room={selectedRoomForPanel}
                  onDelete={(id) => {
                    if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
                      deleteRoomMutation.mutate(id);
                    }
                  }}
                  variant="panel"
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <div className="mb-4">
                    <Building className="h-12 w-12 mx-auto opacity-50" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Select a room</h3>
                  <p>Choose a room from the list to view details</p>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : groupByParent ? (
        <GroupedRoomsView
          groupedRooms={groupedRooms}
          onDelete={(id) => {
            if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
              deleteRoomMutation.mutate(id);
            }
          }}
          view="grid"
          onRoomClick={handleRoomClick}
        />
      ) : (
        <RoomsContent
          isLoading={isLoading}
          rooms={rooms || []}
          filteredRooms={hierarchyFilteredRooms}
          view="grid"
          onDelete={(id) => {
            if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
              deleteRoomMutation.mutate(id);
            }
          }}
          searchQuery={searchQuery}
          onRoomClick={handleRoomClick}
        />
      )}

      <RoomDetailsDialog
        room={selectedRoom}
        isOpen={isRoomDialogOpen}
        onClose={() => {
          setIsRoomDialogOpen(false);
          setSelectedRoom(null);
        }}
        onDelete={(id) => {
          deleteRoomMutation.mutate(id);
        }}
      />
      
      {/* Mobile Inventory Dialog */}
      <MobileInventoryDialog />
    </div>
  );
};

export default RoomsPage;

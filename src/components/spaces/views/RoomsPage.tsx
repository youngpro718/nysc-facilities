
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
import { RoomDetailPanel } from "../components/RoomDetailPanel";
import { CompactRoomList } from "../components/CompactRoomList";
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

export type ViewOption = "master-detail" | "grid" | "list";

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
  const [view, setView] = useState<"master-detail" | "grid" | "list">("master-detail");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  console.log("Current view mode:", view, "isMobile:", isMobile, "should show master-detail:", view === "master-detail" && !isMobile);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Default to grid view on mobile for better UX
      if (window.innerWidth < 768) {
        setView("grid");
      }
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

  // Auto-select first room when in master-detail view and rooms are loaded
  useEffect(() => {
    if (view === "master-detail" && hierarchyFilteredRooms?.length > 0 && !selectedRoom && !isLoading) {
      setSelectedRoom(hierarchyFilteredRooms[0]);
    }
  }, [view, hierarchyFilteredRooms, selectedRoom, isLoading]);

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
    if (view === "master-detail") {
      setSelectedRoom(room);
    } else {
      setSelectedRoom(room);
      setIsRoomDialogOpen(true);
    }
  };

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
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
          view={view}
          onViewChange={setView}
          onRefresh={handleRefresh}
        />
      )}

      {/* Hierarchy Filters - only show when not in master-detail view */}
      {!isMobile && view !== "master-detail" && (
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

      {/* Main Content Area */}
      {view === "master-detail" && !isMobile ? (
        <ResizablePanelGroup direction="vertical" className="h-[800px] rounded-lg border overflow-hidden">
          {/* Top Panel - Room Detail */}
          <ResizablePanel defaultSize={60} minSize={35} maxSize={75}>
            <RoomDetailPanel 
              room={selectedRoom}
              onEdit={(room) => {
                setSelectedRoom(room);
                setIsRoomDialogOpen(true);
              }}
              onDelete={(id) => {
                if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
                  deleteRoomMutation.mutate(id);
                }
              }}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Bottom Panel - Room List */}
          <ResizablePanel defaultSize={40} minSize={25} maxSize={65}>
            <div className="h-full border-t bg-background">
              <div className="p-4 border-b bg-muted/50">
                <h3 className="font-medium text-sm">All Rooms</h3>
                <p className="text-xs text-muted-foreground">
                  {hierarchyFilteredRooms?.length || 0} rooms • Click to view details
                </p>
              </div>
              <CompactRoomList
                rooms={hierarchyFilteredRooms || []}
                selectedRoomId={selectedRoom?.id || null}
                onRoomSelect={handleRoomSelect}
                isLoading={isLoading}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="grid gap-6 grid-cols-1">
          <div className="col-span-1">
            {groupByParent ? (
              <GroupedRoomsView
                groupedRooms={groupedRooms}
                onDelete={(id) => {
                  if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
                    deleteRoomMutation.mutate(id);
                  }
                }}
              view={isMobile ? "grid" : (view === "master-detail" ? "grid" : view)}
                onRoomClick={handleRoomClick}
              />
            ) : (
              <RoomsContent
                isLoading={isLoading}
                rooms={rooms || []}
                filteredRooms={hierarchyFilteredRooms}
                view={isMobile ? "grid" : (view === "master-detail" ? "grid" : view)}
                onDelete={(id) => {
                  if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
                    deleteRoomMutation.mutate(id);
                  }
                }}
                searchQuery={searchQuery}
                onRoomClick={handleRoomClick}
              />
            )}
          </div>
        </div>
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

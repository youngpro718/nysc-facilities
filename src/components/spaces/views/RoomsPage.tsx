
import { useState, useEffect, useMemo } from "react";
import { logger } from '@/lib/logger';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Building } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { FilterBar } from "../rooms/components/FilterBar";
import { MobileFilterBar } from "../rooms/components/MobileFilterBar";
import { RoomsContent } from "../rooms/components/RoomsContent";
import { MobileRoomDrawer } from "../rooms/components/MobileRoomDrawer";
import { MobileInventoryDialog } from "../rooms/components/MobileInventoryDialog";
import { RoomsSidebarList } from "../rooms/components/RoomsSidebarList";
import { RoomCard } from "../rooms/RoomCard";
import { useRoomFilters } from "../hooks/useRoomFilters";
import { useRoomsQuery } from "../hooks/queries/useRoomsQuery";
import { deleteSpace } from "../services/deleteSpace";
import { Room } from "../rooms/types/RoomTypes";
import { useSearchParams } from "react-router-dom";

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



const RoomsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name_asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("");
  
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedRoomForPanel, setSelectedRoomForPanel] = useState<Room | null>(null);
  
  // Read room ID from URL query parameter
  const urlRoomId = searchParams.get('room');
  
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

  const { data: rooms, isLoading, error, refetch } = useRoomsQuery({});
  const { filteredAndSortedRooms } = useRoomFilters({
    rooms,
    searchQuery,
    sortBy,
    statusFilter,
    selectedBuilding: "all",
    selectedFloor: "all",
    roomTypeFilter,
  });
  // Sync selection with URL query parameter
  useEffect(() => {
    const list = filteredAndSortedRooms ?? [];
    
    // If URL has a room ID, try to select it
    if (urlRoomId) {
      const roomFromUrl = list.find((r: Record<string, unknown>) => r.id === urlRoomId);
      if (roomFromUrl && roomFromUrl.id !== selectedRoomForPanel?.id) {
        setSelectedRoomForPanel(roomFromUrl as Room);
        return;
      }
    }
    
    // If current selection exists and is still present in the list, keep it
    if (selectedRoomForPanel && list.some((r: Record<string, unknown>) => r.id === selectedRoomForPanel.id)) {
      return;
    }
    // Otherwise, pick the first available room or clear selection for empty state
    if (list.length > 0) {
      setSelectedRoomForPanel(list[0] as Room);
    } else {
      setSelectedRoomForPanel(null);
    }
  }, [filteredAndSortedRooms, urlRoomId]);

  // Single source of truth for the panel room
  const panelRoom = useMemo(() => {
    const list = filteredAndSortedRooms ?? [];
    if (selectedRoomForPanel && list.some((r: Record<string, unknown>) => r.id === selectedRoomForPanel.id)) {
      return selectedRoomForPanel as Room;
    }
    return (list[0] as Room) ?? null;
  }, [filteredAndSortedRooms, selectedRoomForPanel?.id]);

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
      logger.error('Error deleting room:', error);
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
    logger.debug('Room selected for panel:', room.name, room.id);
    setSelectedRoomForPanel(room);
    // Update URL with selected room ID (preserve other params)
    const newParams = new URLSearchParams(searchParams);
    newParams.set('room', room.id);
    setSearchParams(newParams, { replace: true });
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

      {/* Main Content Area - Master Detail View with left sidebar */}
      {!isMobile ? (
        <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border">
          <ResizablePanel defaultSize={28} minSize={22} maxSize={38}>
            <div className="h-full">
              <RoomsSidebarList
                rooms={filteredAndSortedRooms}
                selectedRoomId={selectedRoomForPanel?.id}
                onSelect={handleRoomSelect}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={72}>
            <div className="p-6 h-full min-h-[520px] flex items-center justify-center">
              { panelRoom ? (
                <RoomCard
                  room={panelRoom}
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
                  <h3 className="text-lg font-medium mb-2">No rooms found</h3>
                  <p>Adjust your search or filters to see rooms</p>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <RoomsContent
          isLoading={isLoading}
          rooms={rooms || []}
          filteredRooms={filteredAndSortedRooms}
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

      <MobileRoomDrawer
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

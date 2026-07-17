
import { useState, useEffect, useMemo } from "react";
import { logger } from '@/lib/logger';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@shared/hooks/use-mobile";
import { useToast } from "@shared/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Search as SearchIcon } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FilterBar } from "../rooms/components/FilterBar";
import { MobileFilterBar } from "../rooms/components/MobileFilterBar";
import { RoomsContent } from "../rooms/components/RoomsContent";
import { MobileRoomDrawer } from "../rooms/components/MobileRoomDrawer";
import { MobileInventoryDialog } from "../rooms/components/MobileInventoryDialog";
import { RoomsSidebarList } from "../rooms/components/RoomsSidebarList";
import { RoomExcelImportExport } from "../rooms/components/RoomExcelImportExport";
import { RoomCard } from "../rooms/RoomCard";
import { useRoomFilters } from "../hooks/useRoomFilters";
import { useRoomsQuery } from "../hooks/queries/useRoomsQuery";
import { getErrorMessage } from "@/lib/errorUtils";
import { deleteSpace } from "../services/deleteSpace";
import { Room } from "../rooms/types/RoomTypes";
import { useSearchParams } from "react-router-dom";
import { useCourtAssignmentsMap } from "@features/spaces/hooks/queries/useCourtAssignmentsMap";
import { CourtroomAssignmentHeader } from "../rooms/components/CourtroomAssignmentHeader";
import { BuildingFloorScopeBar } from "../rooms/components/BuildingFloorScopeBar";
import { CommonAreaPanelCard } from "../rooms/components/CommonAreaPanelCard";
import { fetchCommonAreas } from "../services/commonAreas";
import type { CommonArea } from "../common-areas/types";
import { commonAreaTypeLabel } from "../common-areas/types";

// Sort options offered by the FilterBar/MobileFilterBar dropdowns.
// Keep in sync with the switch in useRoomFilters.
export type SortOption =
  | "name_asc"
  | "name_desc"
  | "room_number_asc"
  | "room_number_desc"
  | "updated_at_desc"
  | "created_at_desc";



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
  const isMobile = useIsMobile();
  const [selectedRoomForPanel, setSelectedRoomForPanel] = useState<Room | null>(null);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);

  // Read room ID from URL query parameter
  const urlRoomId = searchParams.get('room');
  const urlBuildingId = searchParams.get('building');
  const urlFloorId = searchParams.get('floor');
  const autoExpandFloor = searchParams.get('pick') === 'floor';

  const { data: rooms, isLoading, error, refetch } = useRoomsQuery({});
  const { data: assignmentsByRoomId } = useCourtAssignmentsMap();

  // Common areas (hallways, lobbies, …) with water coolers, shown inline in
  // the room list when the water-cooler filter is active. They're a separate
  // table from rooms, so they're fetched here and merged into the list UI.
  const showCoolerAreas = roomTypeFilter === "water_cooler";
  const { data: commonAreasData } = useQuery({
    queryKey: ["common-areas-water-coolers", urlBuildingId || "all", urlFloorId || "all"],
    queryFn: () => fetchCommonAreas(urlBuildingId || undefined, urlFloorId || undefined),
    staleTime: 5 * 60 * 1000,
    enabled: showCoolerAreas,
  });
  const [selectedAreaForPanel, setSelectedAreaForPanel] = useState<CommonArea | null>(null);

  const coolerAreas = useMemo(() => {
    if (!showCoolerAreas) return [];
    const q = searchQuery.trim().toLowerCase();
    return (commonAreasData ?? []).filter((area) => {
      if (area.water_cooler_count <= 0) return false;
      if (statusFilter !== "all" && area.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        area.name,
        area.floor?.name,
        area.floor?.building?.name,
        commonAreaTypeLabel(area.area_type),
        area.description ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [showCoolerAreas, commonAreasData, searchQuery, statusFilter]);

  // The panel shows the selected common area only while it's still in the
  // visible list (filter still active, still matches search).
  const panelArea = useMemo(() => {
    if (!selectedAreaForPanel) return null;
    return coolerAreas.find((a) => a.id === selectedAreaForPanel.id) ?? null;
  }, [selectedAreaForPanel, coolerAreas]);
  const { filteredAndSortedRooms } = useRoomFilters({
    rooms,
    searchQuery,
    sortBy,
    statusFilter,
    selectedBuilding: urlBuildingId || "all",
    selectedFloor: urlFloorId || "all",
    roomTypeFilter,
  });

  // All URL-param setters below use the functional updater form of setSearchParams
  // (prev => next) rather than closing over the `searchParams` value from render scope.
  // Two setSearchParams calls fired back-to-back in the same handler (e.g. "clear all
  // filters", or building-change clearing the floor param) would otherwise each build
  // their URLSearchParams from the same stale snapshot, so the second call silently
  // overwrote the first instead of composing with it.
  const clearBuildingScope = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('building');
      next.delete('floor');
      next.delete('pick');
      return next;
    }, { replace: true });
  };

  const selectFloorScope = (floorId: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (floorId) next.set('floor', floorId);
      else next.delete('floor');
      next.delete('pick');
      return next;
    }, { replace: true });
  };

  // Setters used by the filter bar Building/Floor dropdowns. "all" clears the param.
  // Changing buildings also clears the floor in the SAME update — two back-to-back
  // setSearchParams calls would both build from this render's stale searchParams,
  // so the second would silently drop the building that was just set.
  const setBuildingParam = (id: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id === 'all') next.delete('building');
      else next.set('building', id);
      next.delete('floor');
      next.delete('pick');
      return next;
    }, { replace: true });
  };
  const setFloorParam = (id: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id === 'all') next.delete('floor');
      else next.set('floor', id);
      next.delete('pick');
      return next;
    }, { replace: true });
  };

  // Derive building + floor option lists from the loaded rooms so the selectors
  // only show buildings/floors that actually have rooms. Both are deduped by id.
  const buildingOptions = useMemo(() => {
    const seen = new Map<string, string>();
    (rooms ?? []).forEach((r) => {
      const id = r.floor?.building?.id;
      const name = r.floor?.building?.name;
      if (id && name && !seen.has(id)) seen.set(id, name);
    });
    return Array.from(seen, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [rooms]);

  const floorOptions = useMemo(() => {
    const seen = new Map<string, { name: string; buildingId: string }>();
    (rooms ?? []).forEach((r) => {
      const id = r.floor_id;
      const name = r.floor?.name;
      const buildingId = r.floor?.building?.id;
      if (id && name && buildingId && !seen.has(id)) {
        seen.set(id, { name, buildingId });
      }
    });
    return Array.from(seen, ([id, v]) => ({ id, name: v.name, buildingId: v.buildingId })).sort(
      (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }),
    );
  }, [rooms]);
  // Sync selection with URL query parameter
  useEffect(() => {
    const list = filteredAndSortedRooms ?? [];

    // If URL has a room ID, try to select it
    if (urlRoomId) {
      const roomFromUrl = list.find((r) => r.id === urlRoomId);
      if (roomFromUrl && roomFromUrl.id !== selectedRoomForPanel?.id) {
        setSelectedRoomForPanel(roomFromUrl as Room);
        return;
      }
    }

    // If current selection exists and is still present in the list, keep it
    if (selectedRoomForPanel && list.some((r) => r.id === selectedRoomForPanel.id)) {
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
    if (selectedRoomForPanel && list.some((r) => r.id === selectedRoomForPanel.id)) {
      return selectedRoomForPanel as Room;
    }
    return (list[0] as Room) ?? null;
  }, [filteredAndSortedRooms, selectedRoomForPanel?.id]);

  const panelAssignment = useMemo(() => {
    if (!panelRoom || panelRoom.room_type !== 'courtroom') return null;
    return assignmentsByRoomId?.get(panelRoom.id) ?? null;
  }, [panelRoom, assignmentsByRoomId]);


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
        description: getErrorMessage(error) || "Failed to delete room. Please try again.",
        variant: "destructive",
      });
      logger.error('Error deleting room:', error);
    },
  });

  const hasActiveFilters =
    !!searchQuery || statusFilter !== 'all' || !!roomTypeFilter || !!urlBuildingId || !!urlFloorId;

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setRoomTypeFilter("");
    clearBuildingScope();
  };

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
    logger.debug('Room selected for panel:', { name: room.name, id: room.id });
    setSelectedAreaForPanel(null);
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
    <div className="flex flex-col gap-4 md:h-[calc(100svh-260px)] md:min-h-[520px] md:overflow-hidden">
      {/* Building/Floor scope bar (only when scoped via URL) */}
      {urlBuildingId && (
        <BuildingFloorScopeBar
          buildingId={urlBuildingId}
          floorId={urlFloorId}
          autoExpand={autoExpandFloor}
          onClearBuilding={clearBuildingScope}
          onSelectFloor={selectFloorScope}
        />
      )}

      {/* Filter Bar with Export/Import */}
      <div className="flex flex-wrap justify-between gap-4 shrink-0">
        <div className="flex-1 min-w-0">
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
              buildings={buildingOptions}
              floors={floorOptions}
              selectedBuildingId={urlBuildingId || 'all'}
              selectedFloorId={urlFloorId || 'all'}
              onBuildingChange={setBuildingParam}
              onFloorChange={setFloorParam}
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
              buildings={buildingOptions}
              floors={floorOptions}
              selectedBuildingId={urlBuildingId || 'all'}
              selectedFloorId={urlFloorId || 'all'}
              onBuildingChange={setBuildingParam}
              onFloorChange={setFloorParam}
            />
          )}
        </div>
        <div className="shrink-0 hidden sm:block">
          <RoomExcelImportExport
            projectRef="fmymhtuiqzhupjyopfvi"
            filteredRooms={filteredAndSortedRooms}
            filteredCommonAreas={coolerAreas}
          />
        </div>
      </div>

      {/* Filter result summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0 -mt-2">
          <span>
            Showing {filteredAndSortedRooms.length} of {rooms?.length ?? 0} rooms
            {coolerAreas.length > 0 &&
              ` + ${coolerAreas.length} common ${coolerAreas.length === 1 ? "area" : "areas"}`}
          </span>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-sm"
            onClick={clearAllFilters}
          >
            Clear all filters
          </Button>
        </div>
      )}

      {/* Main Content Area - Master Detail View with left sidebar */}
      {!isMobile ? (
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 min-h-0 rounded-lg border"
        >
          <ResizablePanel defaultSize={28} minSize={22} maxSize={38}>
            <div className="h-full min-h-0">
              <RoomsSidebarList
                rooms={filteredAndSortedRooms}
                selectedRoomId={panelArea ? null : selectedRoomForPanel?.id}
                onSelect={handleRoomSelect}
                isLoading={isLoading}
                assignmentsByRoomId={assignmentsByRoomId}
                commonAreas={coolerAreas}
                selectedCommonAreaId={panelArea?.id}
                onSelectCommonArea={(area) => setSelectedAreaForPanel(area)}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={72}>
            <div className="h-full min-h-0 overflow-y-auto p-6 flex items-start justify-center">
              {panelArea ? (
                <div className="w-full max-w-4xl">
                  <CommonAreaPanelCard area={panelArea} />
                </div>
              ) : panelRoom ? (
                <div className="w-full max-w-4xl space-y-3">
                  {panelAssignment && (
                    <CourtroomAssignmentHeader assignment={panelAssignment} />
                  )}
                  <RoomCard
                    room={panelRoom}
                    onDelete={(id) => setDeleteRoomId(id)}
                    variant="panel"
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <div className="mb-4">
                    <SearchIcon className="h-12 w-12 mx-auto opacity-40" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No rooms found</h3>
                  <p className="text-sm mb-4">Adjust your search or filters to see rooms</p>
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={clearAllFilters}>
                      Clear all filters
                    </Button>
                  )}
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
          commonAreas={coolerAreas}
          view="grid"
          onDelete={(id) => setDeleteRoomId(id)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRoomId} onOpenChange={(open) => !open && setDeleteRoomId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this room? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteRoomId) {
                  deleteRoomMutation.mutate(deleteRoomId);
                  setDeleteRoomId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RoomsPage;

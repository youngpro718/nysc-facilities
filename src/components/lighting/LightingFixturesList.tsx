
import { useState, useEffect, useMemo } from "react";
import { useLightingFixtures } from "@/hooks/useLightingFixtures";
import { LightingFixtureCard } from "@/components/lighting/card/LightingFixtureCard";
import { LightingHeader } from "@/components/lighting/components/LightingHeader";
import { LightingFixture } from "@/types/lighting";
import { MobileLightingList } from "@/components/lighting/mobile/MobileLightingList";
import { RoomLightingView } from "@/components/lighting/room-view/RoomLightingView";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";
import * as locationUtil from "@/components/lighting/utils/location";
import { FixtureSkeleton } from "@/components/lighting/components/FixtureSkeleton";
import { EmptyState } from "@/components/lighting/components/EmptyState";
import { LightingFiltersToolbar, type LightingFilterState } from "@/components/lighting/components/LightingFiltersToolbar";

interface LightingFixturesListProps {
  selectedBuilding?: string;
  selectedFloor?: string;
  statusFilter?: string;
  fixtures?: LightingFixture[];
  isLoading?: boolean;
  refetch?: () => void;
  targetRoomId?: string;
  targetFixtureId?: string;
}

type ViewMode = 'all' | 'by-room';

export const LightingFixturesList = ({ selectedBuilding, selectedFloor, statusFilter, fixtures: fixturesProp, isLoading: isLoadingProp, refetch: refetchProp, targetRoomId, targetFixtureId }: LightingFixturesListProps) => {
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('by-room');
  const [filters, setFilters] = useState<LightingFilterState>({});
  const [page, setPage] = useState(1);
  const pageSize = 12;
  
  // Use parent-provided data if available; fallback to internal hook to stay backward compatible
  const hook = useLightingFixtures();
  const fixtures = fixturesProp ?? hook.fixtures;
  const isLoading = isLoadingProp ?? hook.isLoading;
  const refetch = refetchProp ?? hook.refetch;
  const handleDelete = hook.handleDelete;
  const handleBulkDelete = hook.handleBulkDelete;
  const handleBulkStatusUpdate = hook.handleBulkStatusUpdate;
  const isRefreshing = hook.isFetching;
  const lastUpdated = hook.lastUpdated;

  // Apply combined filters: external props + toolbar
  const filteredFixtures = useMemo(() => {
    const list = fixtures || [];
    const search = (filters.search || '').toLowerCase();
    return list.filter((f) => {
      // Support friendly status in URL like 'out' meaning any non-functional fixture
      if (statusFilter) {
        if (statusFilter === 'out') {
          if (f.status === 'functional') return false;
        } else {
          if (f.status !== statusFilter) return false;
        }
      }
      if (filters.status && f.status !== filters.status) return false;
      if (filters.building && f.building_name !== filters.building) return false;
      if (filters.floor && f.floor_name !== filters.floor) return false;
      if (search) {
        const locationText = locationUtil.getFixtureFullLocationText(f).toLowerCase();
        const hay = `${f.name || ''} ${locationText}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
  }, [fixtures, statusFilter, filters]);

  // Reset pagination when filters change
  useEffect(() => { setPage(1); }, [filters, statusFilter]);

  // If deep-link targets provided, ensure we are in by-room view so we can scroll to a room
  useEffect(() => {
    if (targetRoomId || targetFixtureId) {
      setViewMode('by-room');
    }
  }, [targetRoomId, targetFixtureId]);

  const totalPages = Math.max(1, Math.ceil((filteredFixtures.length || 0) / pageSize));
  const pagedFixtures = useMemo(() => {
    if (viewMode !== 'all') return filteredFixtures;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredFixtures.slice(start, end);
  }, [filteredFixtures, page, viewMode]);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const handleSelectAll = () => {
    if (selectedFixtures.length === filteredFixtures.length) {
      setSelectedFixtures([]);
    } else {
      setSelectedFixtures(filteredFixtures.map(f => f.id));
    }
  };

  const handleBulkDeleteAction = async () => {
    if (selectedFixtures.length > 0) {
      await handleBulkDelete(selectedFixtures);
      setSelectedFixtures([]);
    }
  };

  const handleFixtureSelect = (fixtureId: string, selected: boolean) => {
    if (selected) {
      setSelectedFixtures([...selectedFixtures, fixtureId]);
    } else {
      setSelectedFixtures(selectedFixtures.filter(id => id !== fixtureId));
    }
  };

  const handleHeaderBulkStatusUpdate = async (status: any) => {
    if (selectedFixtures.length > 0) {
      await handleBulkStatusUpdate(selectedFixtures, status);
      setSelectedFixtures([]);
    }
  };

  // Convert fixtures to mobile format
  const mobileFixtures = filteredFixtures.map(fixture => ({
    id: fixture.id,
    name: fixture.name || `Fixture ${fixture.id.slice(0, 8)}`,
    type: fixture.type || 'LED',
    status: fixture.status || 'functional',
    location: locationUtil.getFixtureLocationText(fixture),
    wattage: undefined, // Not available in current type
    lastMaintenance: undefined,
    nextMaintenance: undefined,
    energyConsumption: undefined, // Not available in current type
    issues: 0 // Will be calculated from issues data
  }));

  if (isMobile) {
    return (
      <MobileLightingList
        fixtures={mobileFixtures}
        selectedBuilding={selectedBuilding}
        selectedFloor={selectedFloor}
        onFixtureSelect={setSelectedFixtures}
        onAddFixture={() => {
          // Find the create dialog and trigger it
          const createButton = document.querySelector('[data-testid="create-lighting-button"]');
          if (createButton) {
            (createButton as HTMLElement).click();
          }
        }}
        onBulkAction={(action, fixtureIds) => {
          if (action === "schedule_maintenance") {
            // Handle bulk maintenance scheduling
            toast.success(`Scheduling maintenance for ${fixtureIds.length} fixtures`);
          } else if (action === "toggle_status") {
            // Handle bulk status toggle
            handleBulkStatusUpdate(fixtureIds, 'maintenance_needed');
          }
        }}
      />
    );
  }

  return (
    <div className="container mx-auto p-6">
      <LightingHeader 
        selectedFixtures={selectedFixtures}
        fixtures={filteredFixtures}
        onSelectAll={handleSelectAll}
        onBulkDelete={handleBulkDeleteAction}
        onFixtureCreated={refetch}
        onBulkStatusUpdate={handleHeaderBulkStatusUpdate}
        onRefresh={refetch}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
        showTitle={false}
      />

      {/* Filters toolbar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b py-2 -mx-6 px-6 mb-4">
        <LightingFiltersToolbar
          fixtures={fixtures || []}
          value={filters}
          onChange={setFilters}
        />
      </div>

      {/* View mode toggle */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'by-room' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('by-room')}
            className="flex items-center gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            By Room
          </Button>
          <Button
            variant={viewMode === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('all')}
            className="flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            All Fixtures
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <FixtureSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredFixtures.length === 0 && (
        <EmptyState
          title="No lighting fixtures found"
          description="Try adjusting filters or add a new lighting fixture to get started."
          actionLabel="Add Fixture"
          onAction={() => {
            const createButton = document.querySelector('[data-testid="create-lighting-button"]');
            if (createButton) (createButton as HTMLElement).click();
          }}
        />
      )}

      {/* Render based on view mode when data exists */}
      {!isLoading && filteredFixtures.length > 0 && (viewMode === 'by-room' ? (
        <RoomLightingView
          fixtures={fixtures || []}
          selectedFixtures={selectedFixtures}
          onFixtureSelect={handleFixtureSelect}
          onFixtureDelete={handleDelete}
          onFixtureUpdated={refetch}
          selectedBuilding={selectedBuilding}
          selectedFloor={selectedFloor}
          targetRoomId={targetRoomId}
          targetFixtureId={targetFixtureId}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pagedFixtures.map((fixture) => (
              <LightingFixtureCard
                key={fixture.id}
                fixture={fixture}
                isSelected={selectedFixtures.includes(fixture.id)}
                onSelect={(checked) => handleFixtureSelect(fixture.id, checked)}
                onDelete={() => handleDelete(fixture.id)}
                onFixtureUpdated={refetch}
              />
            ))}
          </div>

          {/* Pagination controls */}
          {filteredFixtures.length > pageSize && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredFixtures.length)} of {filteredFixtures.length}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
          )}
        </>
      ))}
    </div>
  );
}
;

export default LightingFixturesList;


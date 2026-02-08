import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Settings, 
  Plus,
  Lightbulb,
  Zap,
  Calendar,
  List,
  Footprints
} from "lucide-react";
import { toast } from "sonner";
import { MobileSearchBar } from "@/components/mobile/MobileSearchBar";
import { MobileFilterSheet } from "@/components/mobile/MobileFilterSheet";
import { MobileDetailsDialog } from "@/components/mobile/MobileDetailsDialog";
import { EditLightingDialog } from "@/components/lighting/EditLightingDialog";
import { MobileLightingFilters } from "./MobileLightingFilters";
import { MobileLightingFixtureCard } from "./MobileLightingFixtureCard";
import { WalkthroughMode } from "./WalkthroughMode";
import { LightingFixture } from "@/types/lighting";
import * as locationUtil from "@/components/lighting/utils/location";

interface MobileLightingListProps {
  fixtures: LightingFixture[];
  selectedBuilding?: string;
  selectedFloor?: string;
  onFixtureSelect?: (fixtureIds: string[]) => void;
  onAddFixture?: () => void;
  onBulkAction?: (action: string, fixtureIds: string[]) => void;
  onFixtureDelete?: (fixtureId: string) => Promise<boolean>;
  refetch?: () => void;
}

export function MobileLightingList({
  fixtures = [],
  selectedBuilding,
  selectedFloor,
  onFixtureSelect,
  onAddFixture,
  onBulkAction,
  onFixtureDelete,
  refetch
}: MobileLightingListProps) {
  const [mode, setMode] = useState<'list' | 'walkthrough'>('list');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState<LightingFixture | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editingFixture, setEditingFixture] = useState<LightingFixture | null>(null);

  const [filters, setFilters] = useState({
    status: "all",
    type: [] as string[],
    location: [] as string[],
    maintenance: "all"
  });

  if (mode === 'walkthrough') {
    return (
      <WalkthroughMode 
        fixtures={fixtures} 
        onExit={() => setMode('list')} 
        onFixtureUpdate={() => refetch?.()} 
      />
    );
  }

  // Quick filter options
  const quickFilters = [
    { id: "functional", label: "Functional", count: fixtures.filter(f => f.status === 'functional').length, color: "bg-green-500" },
    { id: "maintenance_needed", label: "Maintenance", count: fixtures.filter(f => f.status === 'maintenance_needed').length, color: "bg-yellow-500" },
    { id: "non_functional", label: "Out", count: fixtures.filter(f => f.status === 'non_functional').length, color: "bg-red-500" },
    { id: "LED", label: "LED", count: fixtures.filter(f => f.technology === 'LED').length, color: "bg-blue-500" }
  ];

  // Filter fixtures based on search and filters
  const filteredFixtures = fixtures.filter(fixture => {
    const locationText = locationUtil.getFixtureFullLocationText(fixture).toLowerCase();
    const matchesSearch = fixture.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         locationText.includes(searchQuery.toLowerCase()) ||
                         fixture.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filters.status === "all" || 
                         fixture.status === filters.status;

    const matchesType = filters.type.length === 0 || 
                       filters.type.some(type => fixture.type.toLowerCase().includes(type.toLowerCase()));

    const matchesLocation = filters.location.length === 0 || 
                           filters.location.some(loc => locationText.includes(loc.toLowerCase()));

    return matchesSearch && matchesStatus && matchesType && matchesLocation;
  });

  const handleSelectFixture = (fixtureId: string, checked: boolean) => {
    const newSelected = checked 
      ? [...selectedFixtures, fixtureId]
      : selectedFixtures.filter(id => id !== fixtureId);
    
    setSelectedFixtures(newSelected);
    onFixtureSelect?.(newSelected);
  };

  const handleQuickFilter = (filterId: string) => {
    if (["functional", "maintenance_needed", "non_functional"].includes(filterId)) {
      setFilters(prev => ({ ...prev, status: filterId === prev.status ? 'all' : filterId }));
    } else if (filterId === "LED") {
      // Technology filter implementation would need expansion of filter state or type matching
      // simplifying to type for now or ignoring if strictly technology
    }
  };

  const handleBulkMaintenance = () => {
    if (selectedFixtures.length > 0) {
      onBulkAction?.("schedule_maintenance", selectedFixtures);
      setSelectedFixtures([]);
    }
  };

  const handleBulkToggle = () => {
    if (selectedFixtures.length > 0) {
      onBulkAction?.("toggle_status", selectedFixtures);
      setSelectedFixtures([]);
    }
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status !== "all") count++;
    if (filters.type.length > 0) count++;
    if (filters.location.length > 0) count++;
    if (filters.maintenance !== "all") count++;
    return count;
  };

  const openFixtureDetails = (fixture: LightingFixture) => {
    setSelectedFixture(fixture);
    setShowDetails(true);
  };

  const activeFilterChips = [
    ...(filters.status !== "all" ? [{ id: "status", label: "Status", value: filters.status }] : []),
    ...(filters.type.map(type => ({ id: `type-${type}`, label: "Type", value: type }))),
    ...(filters.location.map(loc => ({ id: `location-${loc}`, label: "Location", value: loc }))),
    ...(filters.maintenance !== "all" ? [{ id: "maintenance", label: "Maintenance", value: filters.maintenance }] : [])
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Mobile Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b p-4 space-y-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Lighting Fixtures</h2>
            <p className="text-sm text-muted-foreground">
              {filteredFixtures.length} of {fixtures.length} fixtures
            </p>
          </div>
          <div className="flex gap-2">
             <Button size="sm" variant="outline" onClick={() => setMode('walkthrough')}>
                <Footprints className="h-4 w-4 mr-2" />
                Walkthrough
             </Button>
             <Button size="sm" onClick={onAddFixture}>
                <Plus className="h-4 w-4" />
             </Button>
          </div>
        </div>

        <MobileSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search fixtures, locations..."
        />

        {/* Quick Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {quickFilters.map((filter) => (
            <Button
              key={filter.id}
              variant={
                (filters.status === filter.id) || 
                (filters.type.includes(filter.id))
                  ? "default" 
                  : "outline"
              }
              size="sm"
              className="flex-shrink-0 h-8"
              onClick={() => handleQuickFilter(filter.id)}
            >
              <div className={`w-2 h-2 rounded-full ${filter.color} mr-2`} />
              {filter.label}
              <Badge variant="secondary" className="ml-2 text-xs px-1">
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Filter Button */}
        <div className="flex items-center justify-between">
          <MobileFilterSheet
            title="Filter Fixtures"
            activeFilters={activeFilterChips}
            onClearFilter={(filterId) => {
              if (filterId === "status") {
                setFilters(prev => ({ ...prev, status: "all" }));
              } else if (filterId.startsWith("type-")) {
                const type = filterId.replace("type-", "");
                setFilters(prev => ({ 
                  ...prev, 
                  type: prev.type.filter(t => t !== type) 
                }));
              } else if (filterId.startsWith("location-")) {
                const location = filterId.replace("location-", "");
                setFilters(prev => ({ 
                  ...prev, 
                  location: prev.location.filter(l => l !== location) 
                }));
              } else if (filterId === "maintenance") {
                setFilters(prev => ({ ...prev, maintenance: "all" }));
              }
            }}
            onClearAll={() => setFilters({
              status: "all",
              type: [],
              location: [],
              maintenance: "all"
            })}
            filterCount={getActiveFilterCount()}
          >
            <MobileLightingFilters
              filters={filters}
              onFiltersChange={setFilters}
            />
          </MobileFilterSheet>

          {/* Bulk Actions */}
          {selectedFixtures.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selectedFixtures.length} selected
              </Badge>
              <Button size="sm" variant="outline" onClick={handleBulkMaintenance}>
                <Calendar className="h-4 w-4 mr-1" />
                Maintenance
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkToggle}>
                <Zap className="h-4 w-4 mr-1" />
                Toggle
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Fixtures List */}
      <div className="flex-1 p-4 space-y-3">
        {filteredFixtures.map((fixture) => (
          <MobileLightingFixtureCard
            key={fixture.id}
            fixture={fixture}
            isSelected={selectedFixtures.includes(fixture.id)}
            onSelect={(checked) => handleSelectFixture(fixture.id, checked)}
            onDelete={async () => {
              if (confirm('Are you sure you want to delete this fixture?')) {
                const success = await onFixtureDelete?.(fixture.id);
                if (success) {
                  // Toast handled in hook
                }
              }
            }}
            onEdit={() => {
              setEditingFixture(fixture);
            }}
            onMaintenance={() => {
              toast.success('Maintenance scheduled for fixture');
            }}
            onViewDetails={() => openFixtureDetails(fixture)}
          />
        ))}

        {filteredFixtures.length === 0 && (
          <div className="text-center py-12">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No fixtures found
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
            <Button variant="outline" onClick={onAddFixture}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Fixture
            </Button>
          </div>
        )}
      </div>

      {/* Fixture Details Dialog */}
      {selectedFixture && (
        <MobileDetailsDialog
          open={showDetails}
          onOpenChange={setShowDetails}
          title={selectedFixture.name}
          description={`${selectedFixture.type} • ${locationUtil.getFixtureFullLocationText(selectedFixture)}`}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Maintenance
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setEditingFixture(selectedFixture);
                  setShowDetails(false);
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className={`mt-1 ${
                  selectedFixture.status === 'functional' 
                    ? 'bg-green-500/10 text-green-700 dark:text-green-400' 
                    : selectedFixture.status === 'maintenance_needed'
                    ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                    : 'bg-red-500/10 text-red-700 dark:text-red-400'
                }`}>
                  {selectedFixture.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bulbs</p>
                <p className="text-sm mt-1">{selectedFixture.bulb_count}x {selectedFixture.technology || 'Bulb'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Location</p>
              <p className="text-sm mt-1">{locationUtil.getFixtureFullLocationText(selectedFixture)}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Maintenance</p>
              <p className="text-sm mt-1">{selectedFixture.last_maintenance_date ? new Date(selectedFixture.last_maintenance_date).toLocaleDateString() : 'No record'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Next Maintenance</p>
              <p className="text-sm mt-1">{selectedFixture.next_maintenance_date ? new Date(selectedFixture.next_maintenance_date).toLocaleDateString() : 'Not scheduled'}</p>
            </div>

            {selectedFixture.status !== 'functional' && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    Issues Detected
                  </p>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {selectedFixture.requires_electrician ? 'Electrician required' : 'Bulb replacement needed'}
                </p>
              </div>
            )}
          </div>
        </MobileDetailsDialog>
      )}

      {editingFixture && (
        <EditLightingDialog
          fixture={editingFixture}
          open={!!editingFixture}
          onOpenChange={(open) => !open && setEditingFixture(null)}
          onFixtureUpdated={() => {
            refetch?.();
            setEditingFixture(null);
          }}
        />
      )}
    </div>
  );
}
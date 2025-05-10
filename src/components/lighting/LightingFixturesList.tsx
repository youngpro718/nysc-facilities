
import { useState, useEffect } from "react";
import { useLightingFixtures } from "./hooks/useLightingFixtures";
import { LightingFixtureCard } from "./card/LightingFixtureCard";
import { LightingFilters } from "./components/LightingFilters";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LightStatus, LightingType } from "./types";
import { 
  Check,
  Filter, 
  Layers, 
  Grid2x2,
  List, 
  AlertOctagon, 
  Trash2,
  RefreshCw,
  Settings,
  CheckCheck,
  Building,
  ListFilter
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateLightingDialog } from "./CreateLightingDialog";
import { Card } from "@/components/ui/card";

interface LightingFixturesListProps {
  selectedBuilding?: string;
  selectedFloor?: string;
}

export function LightingFixturesList({ selectedBuilding = 'all', selectedFloor = 'all' }: LightingFixturesListProps) {
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    status: "all",
    zone_id: "all",
    technology: null as string | null
  });

  const { 
    fixtures, 
    isLoading,
    handleDelete, 
    handleBulkDelete,
    handleBulkStatusUpdate, 
    refetch 
  } = useLightingFixtures();

  // Fetch zones for filtering
  const { data: zones } = useQuery({
    queryKey: ['lighting-zones', selectedBuilding, selectedFloor],
    queryFn: async () => {
      let query = supabase.from('lighting_zones').select('id, name');
      
      if (selectedFloor !== 'all') {
        query = query.eq('floor_id', selectedFloor);
      }
      
      if (selectedBuilding !== 'all') {
        query = query.eq('building_id', selectedBuilding);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data.map(zone => ({ 
        label: zone.name, 
        value: zone.id 
      }));
    },
    enabled: !!selectedBuilding || !!selectedFloor
  });

  // Reset selected fixtures when filters change
  useEffect(() => {
    setSelectedFixtures([]);
  }, [filters, selectedBuilding, selectedFloor]);

  const handleSelectAll = () => {
    if (selectedFixtures.length === filteredFixtures.length) {
      setSelectedFixtures([]);
    } else {
      setSelectedFixtures(filteredFixtures.map(f => f.id));
    }
  };

  const handleBulkAction = async (status: LightStatus) => {
    if (!selectedFixtures.length) return;
    
    await handleBulkStatusUpdate(selectedFixtures, status);
    setSelectedFixtures([]);
  };

  const handleBulkDeleteAction = async () => {
    if (!selectedFixtures.length) return;
    
    await handleBulkDelete(selectedFixtures);
    setSelectedFixtures([]);
  };

  // Filter fixtures based on selected criteria
  const filteredFixtures = fixtures?.filter(fixture => {
    // Apply building and floor filters
    if (selectedBuilding !== "all" && fixture.building_id !== selectedBuilding) {
      return false;
    }
    if (selectedFloor !== "all" && fixture.floor_id !== selectedFloor) {
      return false;
    }
    
    // Apply search filter
    if (filters.search && !fixture.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Apply type filter
    if (filters.type !== "all" && fixture.type !== filters.type) {
      return false;
    }
    
    // Apply status filter
    if (filters.status !== "all" && fixture.status !== filters.status) {
      return false;
    }
    
    // Apply zone filter
    if (filters.zone_id === "unassigned" && fixture.zone_id) {
      return false;
    } else if (filters.zone_id !== "all" && filters.zone_id !== "unassigned" && fixture.zone_id !== filters.zone_id) {
      return false;
    }
    
    // Apply technology filter
    if (filters.technology && filters.technology !== "all" && fixture.technology !== filters.technology) {
      return false;
    }
    
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-12 bg-muted animate-pulse rounded-md"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx} className="h-60 bg-muted animate-pulse rounded-md"></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters row */}
      <div className="flex flex-col gap-4">
        <LightingFilters 
          filters={filters}
          onFilterChange={(newFilters) => setFilters({ ...filters, ...newFilters })}
          zoneOptions={zones}
        />
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={!filteredFixtures.length}
              className="flex items-center gap-2"
            >
              {selectedFixtures.length === filteredFixtures.length && filteredFixtures.length > 0 ? (
                <>
                  <CheckCheck className="h-4 w-4" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Select All</span>
                </>
              )}
            </Button>
            
            {selectedFixtures.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedFixtures.length} selected
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className={viewMode === 'grid' ? 'bg-accent' : ''}
              onClick={() => setViewMode('grid')}
            >
              <Grid2x2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className={viewMode === 'list' ? 'bg-accent' : ''}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            <div className="border-l h-5 mx-2" />
            
            <CreateLightingDialog
              onFixtureCreated={refetch}
              onZoneCreated={() => {}}
            />
            
            {selectedFixtures.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">Bulk Actions</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    className="text-green-600"
                    onClick={() => handleBulkAction('functional')}
                  >
                    Mark as Functional
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-yellow-600"
                    onClick={() => handleBulkAction('maintenance_needed')}
                  >
                    Mark as Needs Maintenance
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={() => handleBulkAction('non_functional')}
                  >
                    Mark as Non-functional
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={handleBulkDeleteAction}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Fixtures grid */}
      {filteredFixtures.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          : "space-y-2"
        }>
          {filteredFixtures.map((fixture) => (
            <LightingFixtureCard
              key={fixture.id}
              fixture={fixture}
              isSelected={selectedFixtures.includes(fixture.id)}
              onSelect={(checked) => {
                if (checked) {
                  setSelectedFixtures([...selectedFixtures, fixture.id]);
                } else {
                  setSelectedFixtures(selectedFixtures.filter(id => id !== fixture.id));
                }
              }}
              onDelete={() => handleDelete(fixture.id)}
              onFixtureUpdated={refetch}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <Building className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No fixtures found</h3>
          <p className="text-muted-foreground">
            {fixtures?.length 
              ? "Try adjusting the filters to see more results."
              : "Start by adding a lighting fixture."}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => setFilters({
            search: "", type: "all", status: "all", zone_id: "all", technology: null
          })}>
            <ListFilter className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
}

// Export as named and default export to support both import styles
export default LightingFixturesList;

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Lightbulb } from "lucide-react";
import { fetchLightingFixtures } from "@/lib/supabase";
import { LightingFixture, LightStatus } from "@/types/lighting";
import { QuickMarkFixtureCard } from "./QuickMarkFixtureCard";
import { getFixtureLocationText } from "../utils/location";

type FilterType = 'all' | 'functional' | 'non_functional' | 'ballast' | 'maintenance';

export function QuickMarkView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const { data: fixtures, isLoading } = useQuery({
    queryKey: ['lighting-fixtures'],
    queryFn: fetchLightingFixtures,
    refetchInterval: 30_000, // Auto-refresh every 30s
  });

  // Smart filtering and searching
  const filteredFixtures = useMemo(() => {
    if (!fixtures) return [];

    let filtered = [...fixtures];

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(f => {
        switch (activeFilter) {
          case 'functional':
            return f.status === 'functional';
          case 'non_functional':
            return f.status === 'non_functional';
          case 'ballast':
            return f.ballast_issue;
          case 'maintenance':
            return f.status === 'maintenance_needed';
          default:
            return true;
        }
      });
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f => {
        const location = getFixtureLocationText(f).toLowerCase();
        const name = f.name?.toLowerCase() || '';
        const roomNumber = f.room_number?.toString().toLowerCase() || '';
        const spaceName = f.space_name?.toLowerCase() || '';
        const technology = f.technology?.toLowerCase() || '';
        
        return (
          location.includes(query) ||
          name.includes(query) ||
          roomNumber.includes(query) ||
          spaceName.includes(query) ||
          technology.includes(query) ||
          query === 'ballast' && f.ballast_issue
        );
      });
    }

    // Sort: OUT lights first, then by location
    return filtered.sort((a, b) => {
      // Priority: non-functional > ballast > maintenance > functional
      const getPriority = (f: LightingFixture) => {
        if (f.status === 'non_functional') return 0;
        if (f.ballast_issue) return 1;
        if (f.status === 'maintenance_needed') return 2;
        return 3;
      };
      
      const priorityDiff = getPriority(a) - getPriority(b);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then sort by location
      return getFixtureLocationText(a).localeCompare(getFixtureLocationText(b));
    });
  }, [fixtures, activeFilter, searchQuery]);

  const filterChips: { id: FilterType; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: fixtures?.length || 0 },
    { 
      id: 'non_functional', 
      label: 'OUT', 
      count: fixtures?.filter(f => f.status === 'non_functional').length || 0 
    },
    { 
      id: 'ballast', 
      label: 'Ballast Issue', 
      count: fixtures?.filter(f => f.ballast_issue).length || 0 
    },
    { 
      id: 'maintenance', 
      label: 'Maintenance', 
      count: fixtures?.filter(f => f.status === 'maintenance_needed').length || 0 
    },
    { 
      id: 'functional', 
      label: 'Functional', 
      count: fixtures?.filter(f => f.status === 'functional').length || 0 
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Quick Mark</h1>
              <p className="text-sm text-muted-foreground">
                {filteredFixtures.length} fixture{filteredFixtures.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search room #, hallway, fixture..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {filterChips.map(chip => (
              <Badge
                key={chip.id}
                variant={activeFilter === chip.id ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setActiveFilter(chip.id)}
              >
                {chip.label} ({chip.count})
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Fixtures List */}
      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading fixtures...</p>
          </div>
        ) : filteredFixtures.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery ? 'No fixtures found matching your search' : 'No fixtures found'}
            </p>
          </div>
        ) : (
          filteredFixtures.map(fixture => (
            <QuickMarkFixtureCard key={fixture.id} fixture={fixture} />
          ))
        )}
      </div>
    </div>
  );
}

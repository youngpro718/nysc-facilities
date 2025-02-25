import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export interface LightingFilters {
  search: string;
  type: string;
  status: string;
  zone_id: string;
}

interface LightingFiltersProps {
  filters: LightingFilters;
  onFilterChange: (filters: Partial<LightingFilters>) => void;
}

const FIXTURE_TYPES = {
  all: "All Types",
  standard: "Standard",
  emergency: "Emergency",
  motion_sensor: "Motion Sensor"
};

const FIXTURE_STATUSES = {
  all: "All Statuses",
  functional: "Functional",
  maintenance_needed: "Needs Maintenance",
  non_functional: "Non-functional"
};

export function LightingFilters({ filters, onFilterChange }: LightingFiltersProps) {
  const { data: zones, isLoading, error } = useQuery({
    queryKey: ['lighting_zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_zones')
        .select('id, name, type')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Ensure the current zone_id exists in the available zones
  const isValidZoneId = zones?.some(zone => zone.id === filters.zone_id) || filters.zone_id === 'all' || filters.zone_id === 'unassigned';
  const safeZoneId = isValidZoneId ? filters.zone_id : 'all';

  // Ensure type and status are valid
  const safeType = Object.keys(FIXTURE_TYPES).includes(filters.type) ? filters.type : 'all';
  const safeStatus = Object.keys(FIXTURE_STATUSES).includes(filters.status) ? filters.status : 'all';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search fixtures..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
          />
        </div>
        <Select
          value={safeType}
          onValueChange={(value) => onFilterChange({ type: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type">
              {FIXTURE_TYPES[safeType as keyof typeof FIXTURE_TYPES]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FIXTURE_TYPES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={safeStatus}
          onValueChange={(value) => onFilterChange({ status: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status">
              {FIXTURE_STATUSES[safeStatus as keyof typeof FIXTURE_STATUSES]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FIXTURE_STATUSES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isLoading ? (
          <Skeleton className="h-10 w-[180px]" />
        ) : (
          <Select
            value={safeZoneId}
            onValueChange={(value) => onFilterChange({ zone_id: value })}
            disabled={!zones || !!error}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {zones?.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.name} ({zone.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
} 
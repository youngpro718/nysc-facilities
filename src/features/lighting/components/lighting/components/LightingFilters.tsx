
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ZoneOption {
  label: string;
  value: string;
}

interface LightingFiltersProps {
  filters: {
    search: string;
    type: string;
    status: string;
    zone_id: string;
    technology: string | null;
  };
  onFilterChange: (filters: Record<string, unknown>) => void;
  zoneOptions: ZoneOption[];
}

export function LightingFilters({ filters, onFilterChange, zoneOptions }: LightingFiltersProps) {
  const [searchText, setSearchText] = useState(filters.search || "");
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search: searchText });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search fixtures..."
              className="pl-8"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </form>

        <Select
          value={filters.type}
          onValueChange={(value) => onFilterChange({ type: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
            <SelectItem value="exit_sign">Exit Sign</SelectItem>
            <SelectItem value="decorative">Decorative</SelectItem>
            <SelectItem value="motion_sensor">Motion Sensor</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) => onFilterChange({ status: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="functional">Functional</SelectItem>
            <SelectItem value="maintenance_needed">Needs Maintenance</SelectItem>
            <SelectItem value="non_functional">Non-functional</SelectItem>
            <SelectItem value="pending_maintenance">Pending Maintenance</SelectItem>
            <SelectItem value="scheduled_replacement">Scheduled Replacement</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.zone_id}
          onValueChange={(value) => onFilterChange({ zone_id: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All zones</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {zoneOptions.map((zone) => (
              <SelectItem key={zone.value} value={zone.value}>
                {zone.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.technology || "all"}
          onValueChange={(value) => onFilterChange({ technology: value === "all" ? null : value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by technology" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All technologies</SelectItem>
            <SelectItem value="LED">LED</SelectItem>
            <SelectItem value="Fluorescent">Fluorescent</SelectItem>
            <SelectItem value="Bulb">Bulb</SelectItem>
          </SelectContent>
        </Select>
      </div>
    
      {(filters.search || filters.type !== "all" || filters.status !== "all" || filters.zone_id !== "all" || filters.technology) && (
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">Active filters:</div>
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <Badge variant="outline" className="gap-1">
                Search: {filters.search}
              </Badge>
            )}
            
            {filters.type !== "all" && (
              <Badge variant="outline" className="gap-1">
                Type: {filters.type}
              </Badge>
            )}
            
            {filters.status !== "all" && (
              <Badge variant="outline" className="gap-1">
                Status: {filters.status}
              </Badge>
            )}
            
            {filters.zone_id !== "all" && (
              <Badge variant="outline" className="gap-1">
                Zone: {filters.zone_id === "unassigned" ? "Unassigned" : 
                  zoneOptions.find(z => z.value === filters.zone_id)?.label || filters.zone_id}
              </Badge>
            )}
            
            {filters.technology && (
              <Badge variant="outline" className="gap-1">
                Technology: {filters.technology}
              </Badge>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onFilterChange({
                search: "", type: "all", status: "all", zone_id: "all", technology: null
              })}
            >
              Clear all
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

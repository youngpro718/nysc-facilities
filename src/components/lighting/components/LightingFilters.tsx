
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Lightbulb, 
  AlertCircle,
  Layers,
  X,
  SlidersHorizontal 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FiltersState {
  search: string;
  type: string;
  status: string;
  zone_id: string;
  technology: string | null;
}

interface LightingFiltersProps {
  filters: FiltersState;
  onFilterChange: (newFilters: Partial<FiltersState>) => void;
  zoneOptions?: { label: string; value: string }[];
}

export function LightingFilters({ 
  filters, 
  onFilterChange,
  zoneOptions = []
}: LightingFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  
  const typeOptions = [
    { label: "All Types", value: "all" },
    { label: "Standard", value: "standard" },
    { label: "Emergency", value: "emergency" },
    { label: "Motion Sensor", value: "motion_sensor" }
  ];
  
  const statusOptions = [
    { label: "All Statuses", value: "all" },
    { label: "Functional", value: "functional" },
    { label: "Needs Maintenance", value: "maintenance_needed" },
    { label: "Non-functional", value: "non_functional" },
    { label: "Pending Maintenance", value: "pending_maintenance" },
    { label: "Scheduled Replacement", value: "scheduled_replacement" }
  ];
  
  const technologyOptions = [
    { label: "All Technologies", value: "all" },
    { label: "LED", value: "LED" },
    { label: "Fluorescent", value: "Fluorescent" },
    { label: "Bulb", value: "Bulb" }
  ];
  
  // Prepare array of active filters for badges
  const activeFilters = [];
  if (filters.type !== "all") {
    activeFilters.push({
      key: "type",
      label: typeOptions.find(o => o.value === filters.type)?.label || filters.type,
    });
  }
  
  if (filters.status !== "all") {
    activeFilters.push({
      key: "status",
      label: statusOptions.find(o => o.value === filters.status)?.label || filters.status,
    });
  }
  
  if (filters.zone_id !== "all") {
    const zoneLabel = filters.zone_id === "unassigned" ? "Unassigned" : 
      zoneOptions.find(o => o.value === filters.zone_id)?.label || "Selected Zone";
    activeFilters.push({
      key: "zone_id",
      label: zoneLabel,
    });
  }
  
  if (filters.technology && filters.technology !== "all") {
    activeFilters.push({
      key: "technology",
      label: technologyOptions.find(o => o.value === filters.technology)?.label || filters.technology,
    });
  }

  // Handle clearing individual filters
  const clearFilter = (key: string) => {
    onFilterChange({ [key]: key === "zone_id" ? "all" : key === "technology" ? "all" : "all" });
  };

  // Handle clearing all filters
  const clearAllFilters = () => {
    onFilterChange({
      type: "all",
      status: "all",
      zone_id: "all",
      technology: "all",
      search: ""
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fixtures..."
            className="pl-8"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
          />
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                <span>Type</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Fixture Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {typeOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.type === option.value}
                  onCheckedChange={() => onFilterChange({ type: option.value })}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>Status</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Fixture Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {statusOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.status === option.value}
                  onCheckedChange={() => onFilterChange({ status: option.value })}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                <span>Zone</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Zone Filter</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem 
                checked={filters.zone_id === "all"}
                onCheckedChange={() => onFilterChange({ zone_id: "all" })}
              >
                All Zones
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={filters.zone_id === "unassigned"}
                onCheckedChange={() => onFilterChange({ zone_id: "unassigned" })}
              >
                Unassigned
              </DropdownMenuCheckboxItem>
              {zoneOptions.map((option) => (
                <DropdownMenuCheckboxItem 
                  key={option.value}
                  checked={filters.zone_id === option.value}
                  onCheckedChange={() => onFilterChange({ zone_id: option.value })}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant={expanded ? "default" : "outline"}
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">More Filters</span>
          </Button>
        </div>
      </div>
      
      {expanded && (
        <div className="flex flex-wrap gap-2 pt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">Technology</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {technologyOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.technology === option.value}
                  onCheckedChange={() => onFilterChange({ technology: option.value === "all" ? null : option.value })}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <Badge 
              key={filter.key} 
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1"
            >
              {filter.label}
              <button
                onClick={() => clearFilter(filter.key)}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {activeFilters.length > 1 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="text-xs h-7"
            >
              Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

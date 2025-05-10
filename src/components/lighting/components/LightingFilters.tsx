
import { useState } from "react";
import { 
  Search,
  SlidersHorizontal,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FilterOption {
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
  onFilterChange: (filters: Partial<{
    search: string;
    type: string;
    status: string;
    zone_id: string;
    technology: string | null;
  }>) => void;
  zoneOptions?: FilterOption[];
}

export function LightingFilters({ filters, onFilterChange, zoneOptions = [] }: LightingFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const typeOptions = [
    { label: "All Types", value: "all" },
    { label: "Standard", value: "standard" },
    { label: "Emergency", value: "emergency" },
    { label: "Motion Sensor", value: "motion_sensor" },
  ];

  const statusOptions = [
    { label: "All Statuses", value: "all" },
    { label: "Functional", value: "functional" },
    { label: "Needs Maintenance", value: "maintenance_needed" },
    { label: "Non-functional", value: "non_functional" },
    { label: "Pending Maintenance", value: "pending_maintenance" },
    { label: "Scheduled Replacement", value: "scheduled_replacement" },
  ];

  const technologyOptions = [
    { label: "All Technologies", value: "all" },
    { label: "LED", value: "LED" },
    { label: "Fluorescent", value: "Fluorescent" },
    { label: "Bulb", value: "Bulb" },
  ];

  const allZoneOptions = [
    { label: "All Zones", value: "all" },
    { label: "Unassigned", value: "unassigned" },
    ...(zoneOptions || [])
  ];

  const handleReset = () => {
    onFilterChange({
      search: "",
      type: "all",
      status: "all",
      zone_id: "all",
      technology: null,
    });
    setIsOpen(false);
  };

  const activeFilterCount = [
    filters.type !== "all" ? 1 : 0,
    filters.status !== "all" ? 1 : 0,
    filters.zone_id !== "all" ? 1 : 0,
    filters.technology !== "all" && filters.technology !== null ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-grow">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search fixtures..."
          className="pl-8"
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
        />
        {filters.search && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => onFilterChange({ search: "" })}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="flex gap-2">
        <Select
          value={filters.type}
          onValueChange={(value) => onFilterChange({ type: value })}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) => onFilterChange({ status: value })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              <SlidersHorizontal className="h-4 w-4" />
              <span>More Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Zone</h4>
                <Select
                  value={filters.zone_id}
                  onValueChange={(value) => onFilterChange({ zone_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {allZoneOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Technology</h4>
                <Select
                  value={filters.technology || "all"}
                  onValueChange={(value) => onFilterChange({ 
                    technology: value === "all" ? null : value 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select technology" />
                  </SelectTrigger>
                  <SelectContent>
                    {technologyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={handleReset}>
                  Reset Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

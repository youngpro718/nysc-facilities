
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { SearchIcon, XIcon } from "lucide-react";
import { TermFilterState } from "@/types/terms";

interface TermsFiltersProps {
  filters: TermFilterState;
  onFilterChange: (filters: TermFilterState) => void;
  locations: string[];
}

export function TermsFilters({ 
  filters, 
  onFilterChange,
  locations
}: TermsFiltersProps) {
  const hasActiveFilters = filters.status || filters.location || filters.search;
  
  const handleClearFilters = () => {
    onFilterChange({
      status: null,
      location: null,
      search: ""
    });
  };
  
  return (
    <div className="mb-4 space-y-4">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search terms..."
            className="pl-8"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          />
        </div>
        
        <div className="flex gap-2">
          <Select 
            value={filters.status || ""}
            onValueChange={(value) => onFilterChange({ ...filters, status: value || null })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={filters.location || ""}
            onValueChange={(value) => onFilterChange({ ...filters, location: value || null })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClearFilters} 
              className="h-10 w-10"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {hasActiveFilters && (
        <div className="flex items-center text-sm">
          <span className="text-muted-foreground">Active filters:</span>
          <div className="flex gap-2 ml-2">
            {filters.status && (
              <div className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">
                Status: {filters.status}
              </div>
            )}
            {filters.location && (
              <div className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">
                Location: {filters.location}
              </div>
            )}
            {filters.search && (
              <div className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">
                Search: "{filters.search}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

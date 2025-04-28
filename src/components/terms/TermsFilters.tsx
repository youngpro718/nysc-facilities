
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TermFilterState } from "@/types/terms";
import { Search, X } from "lucide-react";

interface TermsFiltersProps {
  filters: TermFilterState;
  onFilterChange: (filters: TermFilterState) => void;
  locations: string[];
}

export function TermsFilters({ filters, onFilterChange, locations }: TermsFiltersProps) {
  const handleStatusChange = (value: string) => {
    onFilterChange({ ...filters, status: value === "all" ? null : value });
  };

  const handleLocationChange = (value: string) => {
    onFilterChange({ ...filters, location: value === "all" ? null : value });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const clearFilters = () => {
    onFilterChange({ status: null, location: null, search: "" });
  };

  return (
    <div className="flex flex-col space-y-4 mb-6">
      <div className="flex flex-wrap gap-4">
        <div className="w-full md:w-auto flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search terms..."
              className="pl-8"
              value={filters.search}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        <div className="w-full md:w-auto flex-initial">
          <Select
            value={filters.status || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {locations.length > 0 && (
          <div className="w-full md:w-auto flex-initial">
            <Select
              value={filters.location || "all"}
              onValueChange={handleLocationChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {(filters.status || filters.location || filters.search) && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
            <X className="h-4 w-4 mr-2" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

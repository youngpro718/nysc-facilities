import { useState } from "react";
import { MobileFilterSheet } from "@/components/mobile/MobileFilterSheet";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface OccupantFilters {
  department: string;
  status: string;
  sortBy: string;
  order: 'asc' | 'desc';
}

interface MobileOccupantFiltersProps {
  filters: OccupantFilters;
  onFiltersChange: (filters: OccupantFilters) => void;
}

export function MobileOccupantFilters({
  filters,
  onFiltersChange
}: MobileOccupantFiltersProps) {
  const departmentOptions = [
    { value: 'Administration', label: 'Administration' },
    { value: 'Court Operations', label: 'Court Operations' },
    { value: 'Facilities Management', label: 'Facilities Management' },
    { value: 'Information Technology', label: 'Information Technology' },
    { value: 'Security', label: 'Security' },
    { value: 'Legal Services', label: 'Legal Services' },
    { value: 'Human Resources', label: 'Human Resources' },
    { value: 'Finance', label: 'Finance' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'on_leave', label: 'On Leave' },
    { value: 'terminated', label: 'Terminated' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'department', label: 'Department' },
    { value: 'created_at', label: 'Date Added' },
    { value: 'status', label: 'Status' }
  ];

  const handleDepartmentChange = (department: string, checked: boolean) => {
    if (checked) {
      onFiltersChange({ ...filters, department });
    } else {
      onFiltersChange({ ...filters, department: 'all' });
    }
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      onFiltersChange({ ...filters, status });
    } else {
      onFiltersChange({ ...filters, status: 'all' });
    }
  };

  const getActiveFilters = () => {
    const active = [];
    
    if (filters.department && filters.department !== 'all') {
      const option = departmentOptions.find(o => o.value === filters.department);
      if (option) active.push({ id: `department-${filters.department}`, label: 'Department', value: option.label });
    }
    
    if (filters.status && filters.status !== 'all') {
      const option = statusOptions.find(o => o.value === filters.status);
      if (option) active.push({ id: `status-${filters.status}`, label: 'Status', value: option.label });
    }
    
    return active;
  };

  const clearFilter = (filterId: string) => {
    const [type] = filterId.split('-');
    
    switch (type) {
      case 'department':
        onFiltersChange({ ...filters, department: 'all' });
        break;
      case 'status':
        onFiltersChange({ ...filters, status: 'all' });
        break;
    }
  };

  const clearAll = () => {
    onFiltersChange({
      department: 'all',
      status: 'all',
      sortBy: 'name',
      order: 'asc'
    });
  };

  const activeFilters = getActiveFilters();

  return (
    <MobileFilterSheet
      title="Filter Occupants"
      description="Filter and sort occupants by various criteria"
      activeFilters={activeFilters}
      onClearFilter={clearFilter}
      onClearAll={clearAll}
      filterCount={activeFilters.length}
    >
      {/* Quick Filter Presets */}
      <div>
        <Label className="text-sm font-medium">Quick Filters</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge 
            variant="outline" 
            className="cursor-pointer"
            onClick={() => onFiltersChange({ ...filters, status: 'active' })}
          >
            Active Only
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer"
            onClick={() => onFiltersChange({ ...filters, department: 'Administration' })}
          >
            Administration
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer"
            onClick={() => onFiltersChange({ ...filters, status: 'on_leave' })}
          >
            On Leave
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Department Filter */}
      <div>
        <Label className="text-sm font-medium">Department</Label>
        <div className="space-y-3 mt-2">
          {departmentOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`department-${option.value}`}
                checked={filters.department === option.value}
                onCheckedChange={(checked) => handleDepartmentChange(option.value, checked as boolean)}
              />
              <Label htmlFor={`department-${option.value}`} className="text-sm font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Status Filter */}
      <div>
        <Label className="text-sm font-medium">Status</Label>
        <div className="space-y-3 mt-2">
          {statusOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${option.value}`}
                checked={filters.status === option.value}
                onCheckedChange={(checked) => handleStatusChange(option.value, checked as boolean)}
              />
              <Label htmlFor={`status-${option.value}`} className="text-sm font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Sort Options */}
      <div>
        <Label className="text-sm font-medium">Sort By</Label>
        <div className="space-y-3 mt-2">
          <Select 
            value={filters.sortBy || 'name'} 
            onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={filters.order || 'asc'} 
            onValueChange={(value: 'asc' | 'desc') => onFiltersChange({ ...filters, order: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">A to Z</SelectItem>
              <SelectItem value="desc">Z to A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </MobileFilterSheet>
  );
}
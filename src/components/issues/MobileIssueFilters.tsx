import { useState } from "react";
import { MobileFilterSheet } from "@/components/mobile/MobileFilterSheet";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { IssueFiltersType } from "./types/FilterTypes";

interface MobileIssueFiltersProps {
  filters: IssueFiltersType;
  onFiltersChange: (filters: IssueFiltersType) => void;
  categories: string[];
  assignees: { id: string; name: string; }[];
}

export function MobileIssueFilters({
  filters,
  onFiltersChange,
  categories,
  assignees
}: MobileIssueFiltersProps) {
  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' }
  ];

  const priorityOptions = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const assignmentOptions = [
    { value: 'DCAS', label: 'DCAS' },
    { value: 'OCA', label: 'OCA' },
    { value: 'Self', label: 'Self' },
    { value: 'Outside_Vendor', label: 'Outside Vendor' }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'priority', label: 'Priority' }
  ];

  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      onFiltersChange({ ...filters, status: status as any });
    } else {
      onFiltersChange({ ...filters, status: 'all_statuses' });
    }
  };

  const handlePriorityChange = (priority: string, checked: boolean) => {
    if (checked) {
      onFiltersChange({ ...filters, priority: priority as any });
    } else {
      onFiltersChange({ ...filters, priority: 'all_priorities' });
    }
  };

  const handleAssignmentChange = (assignment: string, checked: boolean) => {
    if (checked) {
      onFiltersChange({ ...filters, assigned_to: assignment as any });
    } else {
      onFiltersChange({ ...filters, assigned_to: 'all_assignments' });
    }
  };

  const getActiveFilters = () => {
    const active = [];
    
    if (filters.status && filters.status !== 'all_statuses') {
      const option = statusOptions.find(o => o.value === filters.status);
      if (option) active.push({ id: `status-${filters.status}`, label: 'Status', value: option.label });
    }
    
    if (filters.priority && filters.priority !== 'all_priorities') {
      const option = priorityOptions.find(o => o.value === filters.priority);
      if (option) active.push({ id: `priority-${filters.priority}`, label: 'Priority', value: option.label });
    }
    
    if (filters.assigned_to && filters.assigned_to !== 'all_assignments') {
      const option = assignmentOptions.find(o => o.value === filters.assigned_to);
      if (option) active.push({ id: `assigned_to-${filters.assigned_to}`, label: 'Assigned To', value: option.label });
    }
    
    return active;
  };

  const clearFilter = (filterId: string) => {
    const [type] = filterId.split('-');
    
    switch (type) {
      case 'status':
        onFiltersChange({ ...filters, status: 'all_statuses' });
        break;
      case 'priority':
        onFiltersChange({ ...filters, priority: 'all_priorities' });
        break;
      case 'assigned_to':
        onFiltersChange({ ...filters, assigned_to: 'all_assignments' });
        break;
    }
  };

  const clearAll = () => {
    onFiltersChange({
      type: 'all_types',
      status: 'all_statuses',
      priority: 'all_priorities',
      assigned_to: 'all_assignments',
      sortBy: 'created_at',
      order: 'desc'
    });
  };

  const activeFilters = getActiveFilters();

  return (
    <MobileFilterSheet
      title="Filter Issues"
      description="Filter and sort issues by various criteria"
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
            onClick={() => onFiltersChange({ ...filters, status: ['open'], assignee: [] })}
          >
            Open Issues
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer"
            onClick={() => onFiltersChange({ ...filters, assignee: ['current-user'] })}
          >
            My Issues
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer"
            onClick={() => onFiltersChange({ ...filters, priority: ['high'] })}
          >
            High Priority
          </Badge>
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
                checked={filters.status.includes(option.value)}
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

      {/* Priority Filter */}
      <div>
        <Label className="text-sm font-medium">Priority</Label>
        <div className="space-y-3 mt-2">
          {priorityOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`priority-${option.value}`}
                checked={filters.priority.includes(option.value)}
                onCheckedChange={(checked) => handlePriorityChange(option.value, checked as boolean)}
              />
              <Label htmlFor={`priority-${option.value}`} className="text-sm font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Category Filter */}
      {categories.length > 0 && (
        <>
          <div>
            <Label className="text-sm font-medium">Category</Label>
            <div className="space-y-3 mt-2">
              {categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={filters.category.includes(category)}
                    onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                  />
                  <Label htmlFor={`category-${category}`} className="text-sm font-normal">
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Assignee Filter */}
      {assignees.length > 0 && (
        <>
          <div>
            <Label className="text-sm font-medium">Assignee</Label>
            <div className="space-y-3 mt-2">
              {assignees.map((assignee) => (
                <div key={assignee.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`assignee-${assignee.id}`}
                    checked={filters.assignee.includes(assignee.id)}
                    onCheckedChange={(checked) => handleAssigneeChange(assignee.id, checked as boolean)}
                  />
                  <Label htmlFor={`assignee-${assignee.id}`} className="text-sm font-normal">
                    {assignee.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Sort Options */}
      <div>
        <Label className="text-sm font-medium">Sort By</Label>
        <div className="space-y-3 mt-2">
          <Select 
            value={filters.sortBy} 
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
            value={filters.sortOrder} 
            onValueChange={(value: 'asc' | 'desc') => onFiltersChange({ ...filters, sortOrder: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </MobileFilterSheet>
  );
}